import * as dotenv from "dotenv";
dotenv.config();

import { ToolRegistry } from "../src/core/toolRegistry";
import { MCPConnection } from "../src/mcp/mcpClient";

async function main() {
  const registry = new ToolRegistry();
  registry.registerInternalTools("test", [
    {
      name: "echo",
      inputSchema: { type: "object" },
      handler: async (args) => args,
    },
    {
      name: "add",
      inputSchema: { type: "object" },
      handler: async (args) => ({
        sum: (args.a as number) + (args.b as number),
      }),
    },
  ]);

  console.log("internal tools:", registry.getRegisteredPaths());
  console.log("test.echo:", await registry.call("test.echo", { msg: "hello" }));
  console.log("test.add:", await registry.call("test.add", { a: 2, b: 3 }));

  if (!process.env.TODOIST_API_KEY) {
    return;
  }

  const connection = await MCPConnection.connect({
    type: "stdio",
    command: "npx",
    args: ["@doist/todoist-ai"],
    env: { TODOIST_API_KEY: process.env.TODOIST_API_KEY },
  });

  registry.registerMCP("todoist", connection);
  console.log("tools ->", registry.getRegisteredPaths());

  const userInfo = await registry.call("todoist.userInfo", {});
  console.log("todoist.userInfo:", userInfo);

  await connection.close();
}

main().catch(console.error);

// npx tsx scripts/testToolRegistry.ts
