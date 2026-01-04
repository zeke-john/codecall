import * as dotenv from "dotenv";
dotenv.config();

import * as readline from "readline";
import { loadMCPServers, MCPServerEntry } from "../src/mcp/loader";
import { TraditionalAgent } from "../src/agents/traditionalAgent";
import { MCPServerConfig } from "../src/mcp/mcpClient";

const COLORS = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

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

function getDefaultServers(): MCPServerConfig[] {
  const servers: MCPServerConfig[] = [
    {
      type: "http",
      url: "http://localhost:4001/mcp",
    },
  ];

  if (process.env.TODOIST_API_KEY) {
    servers.push({
      type: "stdio",
      command: "npx",
      args: ["@doist/todoist-ai"],
      env: { TODOIST_API_KEY: process.env.TODOIST_API_KEY },
    });
  }

  return servers;
}

async function main() {
  const customServers = parseArgs();
  const serversToLoad =
    customServers.length > 0 ? customServers : getDefaultServers();

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
    `${COLORS.green}Connected! ${toolPaths.length} tools available.${COLORS.reset}`
  );
  console.log(
    `${COLORS.dim}Tools: ${toolPaths.slice(0, 5).join(", ")}${
      toolPaths.length > 5 ? ` ...and ${toolPaths.length - 5} more` : ""
    }${COLORS.reset}`
  );
  console.log();

  const agent = new TraditionalAgent({ registry });

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
            process.stdout.write(
              `\n${COLORS.yellow}→ ${tc.name}${COLORS.reset}\n`
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
