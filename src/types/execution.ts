export interface ToolError {
  toolPath: string;
  sdkPath: string;
  errorMessage: string;
}

export interface ExecutionResult {
  status: "success" | "error";
  output?: unknown;
  error?: string;
  progressLogs: unknown[];
  toolErrors: ToolError[];
}
