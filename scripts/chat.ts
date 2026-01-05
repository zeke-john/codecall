import * as dotenv from "dotenv";
dotenv.config();

import * as readline from "readline";
import * as path from "path";
import { loadMCPServers, MCPServerEntry } from "../src/mcp/loader";
import { TraditionalAgent } from "../src/agents/traditionalAgent";
import { CodecallAgent } from "../src/agents/codecallAgent";
import { MCPServerConfig } from "../src/mcp/mcpClient";
import { AgentInterface } from "../src/types";

const COLORS = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

function formatToolCallArgs(
  args: Record<string, unknown>,
  toolName: string
): string {
  if (toolName.endsWith("executeCode") && typeof args.code === "string") {
    return args.code.trim();
  }

  if (toolName.endsWith("readFile") && typeof args.path === "string") {
    return `Path: ${args.path}`;
  }

  return JSON.stringify(args, null, 2);
}

function formatToolResult(result: unknown, toolName: string): string {
  if (result === null || result === undefined) {
    return "null";
  }

  if (typeof result !== "object") {
    return String(result);
  }

  const obj = result as Record<string, unknown>;

  if (toolName.endsWith("readFile") && typeof obj.content === "string") {
    return obj.content;
  }

  if (toolName.endsWith("executeCode") && obj.status !== undefined) {
    const parts: string[] = [];
    parts.push(`Status: ${obj.status}`);

    if (obj.error) {
      parts.push(`Error: ${obj.error}`);
    }

    if (obj.output !== undefined) {
      parts.push("");
      parts.push("Output:");
      parts.push(JSON.stringify(obj.output, null, 2));
    }

    return parts.join("\n");
  }

  return JSON.stringify(result, null, 2);
}

function parseArgs(): MCPServerEntry[] {
  const args = process.argv.slice(2);
  const servers: MCPServerEntry[] = [];

  let i = 0;
  while (i < args.length) {
    if (args[i] === "--stdio") {
      const namespace = args[i + 1];
      const command = args[i + 2];
      const cmdArgs: string[] = [];
      i += 3;

      while (i < args.length && !args[i].startsWith("--")) {
        cmdArgs.push(args[i]);
        i++;
      }

      servers.push({
        namespace,
        config: {
          type: "stdio",
          command,
          args: cmdArgs,
        },
      });
    } else if (args[i] === "--http") {
      const namespace = args[i + 1];
      const url = args[i + 2];
      servers.push({
        namespace,
        config: {
          type: "http",
          url,
        },
      });
      i += 3;
    } else {
      i++;
    }
  }

  return servers;
}

function getDefaultServers(): MCPServerEntry[] {
  const servers: MCPServerEntry[] = [
    {
      namespace: "demo",
      config: {
        type: "http",
        url: "http://localhost:4001/mcp",
      },
    },
  ];

  if (process.env.TODOIST_API_KEY) {
    servers.push({
      namespace: "todoist",
      config: {
        type: "stdio",
        command: "npx",
        args: ["@doist/todoist-ai"],
        env: { TODOIST_API_KEY: process.env.TODOIST_API_KEY },
      },
    });
  }

  return servers;
}

async function main() {
  const useCodecall = process.argv.includes("--codecall");
  const customServers = parseArgs();
  const serversToLoad =
    customServers.length > 0 ? customServers : getDefaultServers();

  const agentMode = useCodecall ? "Codecall" : "Traditional";
  console.log(`${COLORS.cyan}Starting ${agentMode} agent...${COLORS.reset}`);
  console.log(`${COLORS.cyan}Connecting to MCP servers...${COLORS.reset}`);

  let loaded;
  try {
    loaded = await loadMCPServers(serversToLoad);
  } catch (error) {
    console.error(
      `${COLORS.yellow}Failed to connect to MCP servers:${COLORS.reset}`,
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }

  const { registry, close } = loaded;
  const toolPaths = registry.getRegisteredPaths();

  console.log(
    `${COLORS.green}Connected! ${toolPaths.length} MCP tools available.${COLORS.reset}`
  );

  let agent: AgentInterface;

  if (useCodecall) {
    const sdkDir = path.join(process.cwd(), "generatedSdks");
    agent = new CodecallAgent({ mcpRegistry: registry, sdkDir });
    console.log(
      `${COLORS.dim}Mode: Codecall (2 internal tools, SDK file tree in system prompt)${COLORS.reset}`
    );
  } else {
    agent = new TraditionalAgent({ registry });
    console.log(
      `${COLORS.dim}Tools: ${toolPaths.slice(0, 5).join(", ")}${
        toolPaths.length > 5 ? ` ...and ${toolPaths.length - 5} more` : ""
      }${COLORS.reset}`
    );
  }
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question(`${COLORS.bold}You: ${COLORS.reset}`, async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (trimmed === "/exit" || trimmed === "/quit") {
        console.log(`${COLORS.dim}Goodbye!${COLORS.reset}`);
        await close();
        rl.close();
        process.exit(0);
      }

      if (trimmed === "/clear") {
        agent.clearHistory();
        console.log(`${COLORS.dim}History cleared.${COLORS.reset}`);
        prompt();
        return;
      }

      if (trimmed === "/tools") {
        console.log(`${COLORS.cyan}Available tools:${COLORS.reset}`);
        for (const path of toolPaths) {
          console.log(`  - ${path}`);
        }
        prompt();
        return;
      }

      process.stdout.write(`${COLORS.cyan}Assistant: ${COLORS.reset}`);

      try {
        const { stats } = await agent.chat(trimmed, {
          onText: (text) => {
            process.stdout.write(text);
          },
          onToolCall: (tc) => {
            const argsStr = formatToolCallArgs(tc.arguments, tc.name);
            const indentedArgs = argsStr
              .split("\n")
              .map((line) => `  ${line}`)
              .join("\n");
            process.stdout.write(
              `\n${COLORS.yellow}→ ${tc.name}${COLORS.reset}\n${COLORS.dim}${indentedArgs}${COLORS.reset}\n`
            );
          },
          onToolResult: (tr) => {
            const statusColor = tr.isError ? COLORS.yellow : COLORS.green;
            const statusLabel = tr.isError ? "ERROR" : "OK";
            const resultStr = formatToolResult(tr.result, tr.toolName);
            const lines = resultStr.split("\n");
            const maxLen = Math.min(
              80,
              Math.max(...lines.map((l) => l.length), 20)
            );
            const topBorder = "┌" + "─".repeat(maxLen + 2) + "┐";
            const bottomBorder = "└" + "─".repeat(maxLen + 2) + "┘";
            const paddedLines = lines.map((line) => {
              const padding = " ".repeat(Math.max(0, maxLen - line.length));
              return `│ ${line}${padding} │`;
            });
            process.stdout.write(
              `${statusColor} ${statusLabel} -> ${COLORS.reset}\n${
                COLORS.dim
              }${topBorder}\n${paddedLines.join("\n")}\n${bottomBorder}${
                COLORS.reset
              }\n`
            );
          },
          onProgress: (data) => {
            const progressStr =
              typeof data === "string" ? data : JSON.stringify(data);
            process.stdout.write(
              `${COLORS.cyan} -> ${progressStr}${COLORS.reset}\n`
            );
          },
          onComplete: () => {
            process.stdout.write("\n");
          },
          onError: (error) => {
            console.error(
              `\n${COLORS.yellow}Error: ${error.message}${COLORS.reset}\n`
            );
          },
        });

        const parts: string[] = [];
        parts.push(
          `${stats.inferenceSteps} model call${
            stats.inferenceSteps > 1 ? "s" : ""
          }`
        );
        if (stats.toolCallsCount > 0) {
          parts.push(
            `${stats.toolCallsCount} tool${stats.toolCallsCount > 1 ? "s" : ""}`
          );
        }
        parts.push(
          `${stats.totalTokens.toLocaleString()} tokens (${stats.totalPromptTokens.toLocaleString()} in, ${stats.totalCompletionTokens.toLocaleString()} out)`
        );

        console.log(`\n${COLORS.dim}${parts.join(" · ")}${COLORS.reset}\n`);
      } catch (error) {
        console.error(
          `\n${COLORS.yellow}Error: ${
            error instanceof Error ? error.message : error
          }${COLORS.reset}\n`
        );
      }

      prompt();
    });
  };

  console.log(
    `${COLORS.dim}Type your message and press Enter. Commands: /exit, /clear, /tools${COLORS.reset}\n`
  );
  prompt();

  rl.on("close", async () => {
    await close();
    process.exit(0);
  });
}

main().catch(console.error);
