import * as dotenv from "dotenv";
dotenv.config();

import { connectToMCP, MCPServerConfig } from "../src/mcp/mcpClient";
import { generateVirtualSDK } from "../src/sdk/generator";

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY required");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage:");
    console.log(
      "  npm run test:mcp -- stdio <command> [args...] [--env KEY=VALUE ...]"
    );
    console.log("  npm run test:mcp -- http <url>");
    process.exit(1);
  }

  const mode = args[0];
  let config: MCPServerConfig;

  if (mode === "http") {
    config = { type: "http", url: args[1] };
  } else if (mode === "stdio") {
    const restArgs = args.slice(1);
    const envArgs: Record<string, string> = {};
    const commandArgs: string[] = [];
    let collectingEnv = false;

    for (const arg of restArgs) {
      if (arg === "--env") {
        collectingEnv = true;
      } else if (collectingEnv && arg.includes("=")) {
        const [key, ...val] = arg.split("=");
        envArgs[key] = val.join("=");
      } else {
        collectingEnv = false;
        commandArgs.push(arg);
      }
    }

    config = {
      type: "stdio",
      command: commandArgs[0],
      args: commandArgs.slice(1),
      env: Object.keys(envArgs).length > 0 ? envArgs : undefined,
    };
  } else {
    console.error(`Unknown mode: ${mode}`);
    process.exit(1);
  }

  const source = await connectToMCP(config);
  console.log("source:", JSON.stringify(source, null, 2));
  const sdk = await generateVirtualSDK([source]);

  console.log("\nsdk.getTree():");
  console.log(sdk.getTree());

  const firstFile = sdk.getAllPaths()[0];
  console.log(`\nsdk.get("${firstFile}"):`);
  console.log(sdk.get(firstFile));
}

main().catch(console.error);

// npm run test:mcp -- stdio node todoist-mcp-server/dist/index.js --env TODOIST_API_TOKEN=xxx
