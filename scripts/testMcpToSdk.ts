import * as dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import * as path from "path";
import { MCPServerConfig } from "../src/mcp/mcpClient";
import { generateVirtualSDKFromMCP } from "../src/sdk/generator";

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
      "  npm run test:mcp -- stdio <command> [args...] [--env KEY=VALUE ...] [--skip-discovery] [--output <dir>]"
    );
    console.log(
      "  npm run test:mcp -- http <url> [--skip-discovery] [--output <dir>]"
    );
    console.log("  npm run test:mcp -- read <filePath> [--base <dir>]");
    console.log("\nOptions:");
    console.log(
      "  --skip-discovery  Skip output schema discovery (faster, but no output types)"
    );
    console.log(
      "  --output <dir>    Write SDK files to disk (default: generatedSdks)"
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
  let skipDiscovery = false;
  let outputDir: string | undefined;

  if (mode === "http") {
    config = { type: "http", url: args[1] };
    skipDiscovery = args.includes("--skip-discovery");
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
      if (arg === "--skip-discovery") {
        skipDiscovery = true;
      } else if (arg === "--output") {
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
  console.log(`Skip discovery: ${skipDiscovery}`);
  if (outputDir) {
    console.log(`Output directory: ${outputDir}`);
  }

  const { vfs, errors } = await generateVirtualSDKFromMCP(config, {
    skipOutputDiscovery: skipDiscovery,
  });

  if (errors.length > 0) {
    console.log("\nDiscovery errors:");
    for (const error of errors) {
      console.log(`  - ${error.toolName}: ${error.error}`);
    }
  }

  console.log("\nGenerated files:");
  console.log(vfs.getTree());

  if (outputDir) {
    const fullOutputPath = path.resolve(outputDir);
    await vfs.writeToDisk(fullOutputPath);
    console.log(`\nFiles written to: ${fullOutputPath}`);
  } else {
    const allPaths = vfs.getAllPaths();
    for (const filePath of allPaths) {
      console.log(`\n--- ${filePath} ---`);
      console.log(vfs.get(filePath));
    }
  }
}

main().catch(console.error);

// npm run test:mcp -- stdio npx @doist/todoist-ai --env TODOIST_API_KEY=xxx --output generatedSdks
// npm run test:mcp -- stdio npx @brightdata/mcp --env API_TOKEN=xxx --output generatedSdks
//npm run test:mcp -- stdio npx @playwright/mcp@latest --output generatedSdks
// --skip-discovery

// npm run test:mcp -- read tools/bright_data/searchEngine.ts
