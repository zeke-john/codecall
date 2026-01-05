import * as fs from "fs";
import * as path from "path";
import { Sandbox } from "./sandbox";
import { InternalToolDefinition } from "../types/registry";

export interface InternalToolsConfig {
  sdkDir: string;
  sandbox: Sandbox;
  getProgressHandler?: () => ((data: unknown) => void) | undefined;
  readSdkPaths?: Set<string>;
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

function extractToolCallsFromCode(code: string): string[] {
  const toolCallPattern = /tools\.(\w+)\.(\w+)\s*\(/g;
  const toolCalls: string[] = [];
  let match;

  while ((match = toolCallPattern.exec(code)) !== null) {
    const namespace = match[1];
    const method = match[2];
    toolCalls.push(`${namespace}/${method}.ts`);
  }

  return [...new Set(toolCalls)];
}

function normalizeSdkPath(p: string): string {
  return p.trim().replace(/^tools\//, "");
}

export function createInternalTools(
  config: InternalToolsConfig
): InternalToolDefinition[] {
  const { sdkDir, sandbox, getProgressHandler } = config;
  const readSdkPaths = config.readSdkPaths ?? new Set<string>();
  const toolsDir = path.join(sdkDir, "tools");

  const readFileTool: InternalToolDefinition = {
    name: "readFile",
    description:
      "REQUIRED before executeCode: Read an SDK file to get exact parameter names and types. You MUST call this for EVERY tool before using it in executeCode(). Path relative to tools/, e.g. 'todoist/findTasks.ts'",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Path to the SDK file relative to tools/, e.g. 'todoist/findTasks.ts'",
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
        readSdkPaths.add(filePath);
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
      "Execute TypeScript code in a sandbox. You MUST read SDK files with readFile() first and list them in sdkFilesRead. The code can call tools via tools.namespace.method(). Use progress() for updates. Return a value at the end.",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description:
            "TypeScript code to execute. Can use 'await tools.namespace.method()' to call tools and 'progress(data)' for updates.",
        },
        sdkFilesRead: {
          type: "array",
          items: { type: "string" },
          description:
            'REQUIRED: List every SDK file you read for tools used in this code, e.g. ["todoist/findTasks.ts", "todoist/findProjects.ts"]. Must match tools called in code.',
        },
      },
      required: ["code", "sdkFilesRead"],
    },
    handler: async (args) => {
      const code = args.code as string;
      const sdkFilesReadArg = args.sdkFilesRead as string[] | undefined;

      if (!code) {
        return { status: "error", error: "Code is required", progressLogs: [] };
      }

      if (!sdkFilesReadArg || sdkFilesReadArg.length === 0) {
        const toolsInCode = extractToolCallsFromCode(code);
        if (toolsInCode.length > 0) {
          return {
            status: "error",
            error: `sdkFilesRead is required. You must list the SDK files for all tools used in your code.\n\nTools detected in code:\n${toolsInCode
              .map((t) => `  - "${t}"`)
              .join(
                "\n"
              )}\n\nAdd these to sdkFilesRead and ensure you called readFile() for each.`,
            progressLogs: [],
          };
        }
      }

      const declared = new Set((sdkFilesReadArg ?? []).map(normalizeSdkPath));
      const actuallyUsed = new Set(
        extractToolCallsFromCode(code).map(normalizeSdkPath)
      );

      const missingFromManifest = [...actuallyUsed].filter(
        (p) => !declared.has(p)
      );
      if (missingFromManifest.length > 0) {
        return {
          status: "error",
          error: `Manifest incomplete: your code calls tools not listed in sdkFilesRead.\n\nAdd these to sdkFilesRead (and ensure you called readFile on them):\n${missingFromManifest
            .map((p) => `  - "${p}"`)
            .join("\n")}`,
          progressLogs: [],
        };
      }

      const missingReads = [...declared].filter((p) => !readSdkPaths.has(p));
      if (missingReads.length > 0) {
        return {
          status: "error",
          error: `SDK files not read before execution. You listed these in sdkFilesRead but didn't call readFile() for them:\n\n${missingReads
            .map((p) => `  - readFile("${p}")`)
            .join(
              "\n"
            )}\n\nRead these SDK files first, then retry executeCode().`,
          progressLogs: [],
        };
      }

      const onProgress = getProgressHandler?.();
      return sandbox.execute(code, { onProgress });
    },
  };

  return [readFileTool, executeCodeTool];
}
