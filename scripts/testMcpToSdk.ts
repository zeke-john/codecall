import * as dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import * as path from "path";
import { MCPServerConfig } from "../src/mcp/mcpClient";
import { generateSDKFromMCP } from "../src/sdk/generator";

function toolNameToFileName(toolName: string): string {
  if (toolName.includes("_") || toolName.includes("-")) {
    const camelCase = toolName
      .split(/[_-]/)
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");
    return `${camelCase}.ts`;
  }
  return `${toolName.charAt(0).toLowerCase() + toolName.slice(1)}.ts`;
}

async function readGeneratedFile(filePath: string, baseDir = "generatedSdks") {
  const fullPath = path.resolve(baseDir, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  const content = fs.readFileSync(fullPath, "utf-8");
  console.log(`--- ${filePath} ---`);
  console.log(content);
  return content;
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY required");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage:");
    console.log(
      "  npm run test:mcp -- stdio <command> [args...] [--env KEY=VALUE ...] [--output <dir>]"
    );
    console.log("  npm run test:mcp -- http <url> [--output <dir>]");
    console.log("  npm run test:mcp -- read <filePath> [--base <dir>]");
    console.log("\nOptions:");
    console.log(
      "  --output <dir>    Output directory for SDK files (default: generatedSdks)"
    );
    console.log(
      "  --base <dir>      Base directory for read mode (default: generatedSdks)"
    );
    process.exit(1);
  }

  const mode = args[0];

  if (mode === "read") {
    const filePath = args[1];
    if (!filePath) {
      console.error("File path required for read mode");
      process.exit(1);
    }
    const baseIdx = args.indexOf("--base");
    const baseDir =
      baseIdx !== -1 && args[baseIdx + 1] ? args[baseIdx + 1] : "generatedSdks";
    await readGeneratedFile(filePath, baseDir);
    return;
  }

  let config: MCPServerConfig;
  let outputDir = "generatedSdks";

  if (mode === "http") {
    config = { type: "http", url: args[1] };
    const outputIdx = args.indexOf("--output");
    if (outputIdx !== -1 && args[outputIdx + 1]) {
      outputDir = args[outputIdx + 1];
    }
  } else if (mode === "stdio") {
    const restArgs = args.slice(1);
    const envArgs: Record<string, string> = {};
    const commandArgs: string[] = [];
    let collectingEnv = false;
    let expectingOutput = false;

    for (const arg of restArgs) {
      if (arg === "--output") {
        expectingOutput = true;
      } else if (expectingOutput) {
        outputDir = arg;
        expectingOutput = false;
      } else if (arg === "--env") {
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

  console.log("Connecting to MCP server...");
  console.log(`Output directory: ${outputDir}`);

  const result = await generateSDKFromMCP(config, { outputDir });

  console.log(`\nGenerated SDK: ${result.folderName}`);
  console.log("Files written:");
  for (const file of result.files) {
    console.log(`  ${file}`);
  }
  console.log(`\nOutput: ${path.resolve(outputDir)}/tools`);

  console.log("\n===========================================");
  console.log("MANUAL UPDATES REQUIRED!");

  console.log("\nAll SDK files need INPUT and OUTPUT examples added manually.");
  console.log(
    "Examples help the LLM understand expected data formats and write correct code consistently.\n"
  );

  if (result.toolsMissingOutputSchema.length > 0) {
    console.log(
      `${result.toolsMissingOutputSchema.length} tools need output interfaces AND input/output examples:`
    );
    for (const toolName of result.toolsMissingOutputSchema) {
      console.log(`  - ${toolNameToFileName(toolName)}`);
    }
    console.log(
      "\nThese were defaulted to return Promise<unknown>. Please add an Output interface AND input/output examples."
    );
  }

  if (result.toolsWithOutputSchema.length > 0) {
    console.log(
      `${result.toolsWithOutputSchema.length} tools already have output interfaces.`
    );
    for (const toolName of result.toolsWithOutputSchema) {
      console.log(`  - ${toolNameToFileName(toolName)}`);
    }
    console.log("Please add input/output examples to the SDK files.");
  }

  console.log("\n===========================================\n");
  console.log(
    "Please see a full example in docs/exampleSdkFile.ts for how a SDK file should look -> "
  );
  console.log(
    "https://github.com/zeke-john/codecall/blob/main/docs/exampleSdkFile.ts"
  );
}

main().catch(console.error);

// npm run test:mcp -- stdio npx @doist/todoist-ai --output generatedSdks
// npm run test:mcp -- stdio npx @brightdata/mcp --output generatedSdks
// npm run test:mcp -- stdio npx @playwright/mcp@latest --output generatedSdks
// npm run test:mcp -- stdio docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server --env GITHUB_PERSONAL_ACCESS_TOKEN=xxx --output generatedSdks

// example of reading a generated file ->
// npm run test:mcp -- read tools/brightData/searchEngine.ts
