export interface ExecutionResult {
  status: "success" | "error";
  output?: unknown;
  error?: string;
  progressLogs: unknown[];
}
