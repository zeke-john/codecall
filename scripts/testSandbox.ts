import * as dotenv from "dotenv";
dotenv.config();

import { ToolRegistry } from "../src/core/toolRegistry";
import { Sandbox } from "../src/core/sandbox";
import { MCPConnection } from "../src/mcp/mcpClient";

async function main() {
  if (!process.env.TODOIST_API_KEY) {
    console.log("test for todoist mcp, rm this if your not using this");
    return;
  }
  const registry = new ToolRegistry();
  const sandbox = new Sandbox(registry);

  const connection = await MCPConnection.connect({
    type: "stdio",
    command: "npx",
    args: ["@doist/todoist-ai"],
    env: { TODOIST_API_KEY: process.env.TODOIST_API_KEY },
  });
  registry.registerMCP("todoist", connection);

  console.log("all tools:", registry.getRegisteredPaths());

  const result = await sandbox.execute(
    `
    progress({ step: 1, message: "Searching tasks..." });
    const tasks = await tools.todoist.search({ query: "task" });
    progress({ step: 2, message: "getting only titles", count: tasks.results.length });
    const titles = tasks.results.map(task => task.title);
    progress({ step: 3, message: "returning titles" });

    progress({ step: 4, message: "Creating task..." });
    const newTask = await tools.todoist.addTasks({ 
      tasks: [{ content: "4:48 pm jan 2" }] 
    });
    progress({ step: 5, message: "Task created" });

    return { titles, newTask };
  `,
    {
      onProgress: (data) => {
        console.log(data);
      },
    }
  );

  console.log("Status:", result.status);
  console.log("Progress:", JSON.stringify(result.progressLogs, null, 2));
  if (result.error) {
    console.log("Error:", result.error);
  } else {
    console.log("Output:", JSON.stringify(result.output, null, 2));
  }

  await connection.close();
}

main().catch(console.error);

// npx tsx scripts/testSandbox.ts
