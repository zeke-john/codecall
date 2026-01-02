import * as fs from "fs";
import * as path from "path";
import { ToolSource, GeneratedSDK, ClassifiedToolSource } from "../types";
import {
  generateSDKFromLLM,
  generateSDKFromClassifiedSource,
} from "../llm/modelClient";
import { MCPConnection, MCPServerConfig } from "../mcp/mcpClient";
import { discoverOutputSchemas } from "./outputSchemaDiscoverer";

export async function generateSDK(source: ToolSource): Promise<GeneratedSDK> {
  return generateSDKFromLLM(source);
}

export async function generateSDKWithDiscovery(
  source: ClassifiedToolSource
): Promise<GeneratedSDK> {
  return generateSDKFromClassifiedSource(source);
}

async function writeSDKToDisk(
  sdk: GeneratedSDK,
  outputDir: string
): Promise<string[]> {
  const writtenPaths: string[] = [];

  for (const file of sdk.files) {
    const filePath = `tools/${sdk.folderName}/${file.fileName}`;
    const fullPath = path.join(outputDir, filePath);
    const dir = path.dirname(fullPath);

    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(fullPath, file.content, "utf-8");
    writtenPaths.push(filePath);
  }

  return writtenPaths;
}

export interface GenerateOptions {
  skipOutputDiscovery?: boolean;
  outputDir: string;
}

export interface GenerateResult {
  folderName: string;
  files: string[];
  errors: Array<{ toolName: string; error: string }>;
}

export async function generateSDKFromMCP(
  config: MCPServerConfig,
  options: GenerateOptions
): Promise<GenerateResult> {
  const connection = await MCPConnection.connect(config);
  let errors: Array<{ toolName: string; error: string }> = [];
  let sdk: GeneratedSDK;

  try {
    if (options.skipOutputDiscovery) {
      const source = connection.getToolSource();
      sdk = await generateSDK(source);
    } else {
      const result = await discoverOutputSchemas(connection);
      errors = result.errors;
      sdk = await generateSDKWithDiscovery(result.classifiedSource);
    }

    const files = await writeSDKToDisk(sdk, options.outputDir);

    return {
      folderName: sdk.folderName,
      files,
      errors,
    };
  } finally {
    await connection.close();
  }
}

export async function generateSDKFromSources(
  sources: ToolSource[],
  outputDir: string
): Promise<string[]> {
  const allPaths: string[] = [];

  for (const source of sources) {
    const sdk = await generateSDK(source);
    const paths = await writeSDKToDisk(sdk, outputDir);
    allPaths.push(...paths);
  }

  return allPaths;
}
