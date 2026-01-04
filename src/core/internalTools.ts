import * as fs from "fs";
import * as path from "path";
import { Sandbox } from "./sandbox";
import { InternalToolDefinition } from "../types/registry";

export interface InternalToolsConfig {
  sdkDir: string;
  sandbox: Sandbox;
  getProgressHandler?: () => ((data: unknown) => void) | undefined;
}

interface FileTreeEntry {
  name: string;
  type: "file" | "directory";
  children?: FileTreeEntry[];
}

function buildFileTree(dirPath: string): FileTreeEntry[] {
  const entries: FileTreeEntry[] = [];

  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      if (item.name.startsWith(".")) continue;

      if (item.isDirectory()) {
        const children = buildFileTree(path.join(dirPath, item.name));
        entries.push({
          name: item.name,
          type: "directory",
          children,
        });
      } else if (item.isFile() && item.name.endsWith(".ts")) {
        entries.push({
          name: item.name,
          type: "file",
        });
      }
    }
  } catch {
    return [];
  }

  return entries.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "directory" ? -1 : 1;
  });
}

function formatTreeLine(
  entry: FileTreeEntry,
  prefix: string,
  isLast: boolean
): string[] {
  const lines: string[] = [];
  const connector = isLast ? "└─ " : "├─ ";
  lines.push(`${prefix}${connector}${entry.name}`);

  if (entry.type === "directory" && entry.children) {
    const newPrefix = prefix + (isLast ? "   " : "│  ");
    entry.children.forEach((child, index) => {
      const childIsLast = index === entry.children!.length - 1;
      lines.push(...formatTreeLine(child, newPrefix, childIsLast));
    });
  }

  return lines;
}

export function generateFileTree(sdkDir: string): string {
  const toolsDir = path.join(sdkDir, "tools");
  const tree = buildFileTree(toolsDir);

  if (tree.length === 0) {
    return "tools/\n(empty)";
  }

  const lines = ["tools/"];
  tree.forEach((entry, index) => {
    const isLast = index === tree.length - 1;
    lines.push(...formatTreeLine(entry, "", isLast));
  });

  return lines.join("\n");
}

function isPathSafe(basePath: string, requestedPath: string): boolean {
  const resolvedBase = path.resolve(basePath);
  const resolvedPath = path.resolve(basePath, requestedPath);
  return resolvedPath.startsWith(resolvedBase + path.sep);
}

export function createInternalTools(
  config: InternalToolsConfig
): InternalToolDefinition[] {
  const { sdkDir, sandbox, getProgressHandler } = config;
  const toolsDir = path.join(sdkDir, "tools");

  const readFileTool: InternalToolDefinition = {
    name: "readFile",
    description:
      "Read the contents of an SDK file to understand types and how to call the tool. Path should be relative to tools/, e.g. 'test/getUsers.ts'",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Path to the SDK file relative to tools/, e.g. 'test/getUsers.ts'",
        },
      },
      required: ["path"],
    },
    handler: async (args) => {
      const filePath = args.path as string;

      if (!filePath) {
        return { error: "Path is required" };
      }

      if (!isPathSafe(toolsDir, filePath)) {
        return {
          error: "Invalid path: cannot access files outside SDK directory",
        };
      }

      const fullPath = path.join(toolsDir, filePath);

      try {
        const content = await fs.promises.readFile(fullPath, "utf-8");
        return { content };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: `Failed to read file: ${message}` };
      }
    },
  };

  const executeCodeTool: InternalToolDefinition = {
    name: "executeCode",
    description:
      "Execute TypeScript code in a sandbox. The code can call tools via tools.namespace.method(). Use progress() to provide real-time updates. Return a value at the end.",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description:
            "TypeScript code to execute. Can use 'await tools.namespace.method()' to call tools and 'progress(data)' for updates.",
        },
      },
      required: ["code"],
    },
    handler: async (args) => {
      const code = args.code as string;

      if (!code) {
        return { status: "error", error: "Code is required", progressLogs: [] };
      }

      const onProgress = getProgressHandler?.();
      return sandbox.execute(code, { onProgress });
    },
  };

  return [readFileTool, executeCodeTool];
}
