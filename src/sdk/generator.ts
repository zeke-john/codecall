import {
  ToolSource,
  GeneratedSDK,
  VirtualFileSystem,
  ClassifiedToolSource,
} from "../types";
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

export async function generateVirtualSDK(
  sources: ToolSource[]
): Promise<VirtualFileSystem> {
  const vfs = new VirtualFileSystem();
  for (const source of sources) {
    const sdk = await generateSDK(source);
    for (const file of sdk.files) {
      const path = `tools/${sdk.folderName}/${file.fileName}`;
      vfs.set(path, file.content);
    }
  }

  return vfs;
}

export interface DiscoveryOptions {
  skipOutputDiscovery?: boolean;
}

export async function generateVirtualSDKFromMCP(
  config: MCPServerConfig,
  options: DiscoveryOptions = {}
): Promise<{
  vfs: VirtualFileSystem;
  errors: Array<{ toolName: string; error: string }>;
}> {
  const connection = await MCPConnection.connect(config);
  const vfs = new VirtualFileSystem();
  let errors: Array<{ toolName: string; error: string }> = [];

  try {
    if (options.skipOutputDiscovery) {
      const source = connection.getToolSource();
      const sdk = await generateSDK(source);
      for (const file of sdk.files) {
        const path = `tools/${sdk.folderName}/${file.fileName}`;
        vfs.set(path, file.content);
      }
    } else {
      const result = await discoverOutputSchemas(connection);
      errors = result.errors;

      const sdk = await generateSDKWithDiscovery(result.classifiedSource);
      for (const file of sdk.files) {
        const path = `tools/${sdk.folderName}/${file.fileName}`;
        vfs.set(path, file.content);
      }
    }
  } finally {
    await connection.close();
  }

  return { vfs, errors };
}
