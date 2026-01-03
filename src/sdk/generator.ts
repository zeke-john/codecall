import * as fs from "fs";
import * as path from "path";
import { ToolSource, GeneratedSDK } from "../types";
import { generateSDKFromLLM } from "../llm/modelClient";
import { MCPConnection, MCPServerConfig } from "../mcp/mcpClient";

export async function generateSDK(source: ToolSource): Promise<GeneratedSDK> {
  return generateSDKFromLLM(source);
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
  outputDir: string;
}

export interface GenerateResult {
  folderName: string;
  files: string[];
  toolsMissingOutputSchema: string[];
  toolsWithOutputSchema: string[];
  totalTools: number;
}

export async function generateSDKFromMCP(
  config: MCPServerConfig,
  options: GenerateOptions
): Promise<GenerateResult> {
  const connection = await MCPConnection.connect(config);

  try {
    const source = connection.getToolSource();
    const sdk = await generateSDK(source);
    const files = await writeSDKToDisk(sdk, options.outputDir);

    const toolsMissingOutputSchema = source.tools
      .filter((tool) => !tool.outputSchema)
      .map((tool) => tool.name);

    const toolsWithOutputSchema = source.tools
      .filter((tool) => tool.outputSchema)
      .map((tool) => tool.name);

    return {
      folderName: sdk.folderName,
      files,
      toolsMissingOutputSchema,
      toolsWithOutputSchema,
      totalTools: source.tools.length,
    };
  } finally {
    await connection.close();
  }
}

export async function generateSDKFromSources(
  sources: ToolSource[],
  outputDir: string
): Promise<{
  files: string[];
  toolsMissingOutputSchema: string[];
  toolsWithOutputSchema: string[];
  totalTools: number;
}> {
  const allPaths: string[] = [];
  const allMissing: string[] = [];
  const allWithSchema: string[] = [];
  let total = 0;

  for (const source of sources) {
    const sdk = await generateSDK(source);
    const paths = await writeSDKToDisk(sdk, outputDir);
    allPaths.push(...paths);

    const missing = source.tools
      .filter((tool) => !tool.outputSchema)
      .map((tool) => tool.name);
    allMissing.push(...missing);

    const withSchema = source.tools
      .filter((tool) => tool.outputSchema)
      .map((tool) => tool.name);
    allWithSchema.push(...withSchema);

    total += source.tools.length;
  }

  return {
    files: allPaths,
    toolsMissingOutputSchema: allMissing,
    toolsWithOutputSchema: allWithSchema,
    totalTools: total,
  };
}
