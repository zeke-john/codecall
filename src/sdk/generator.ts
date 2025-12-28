import { ToolSource, GeneratedSDK, VirtualFileSystem } from "../types";
import { generateSDKFromLLM } from "../llm/modelClient";

export async function generateSDK(source: ToolSource): Promise<GeneratedSDK> {
  return generateSDKFromLLM(source);
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
