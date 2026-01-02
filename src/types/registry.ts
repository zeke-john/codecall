import { JSONSchema } from "./tool";

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export interface InternalToolDefinition {
  name: string;
  description?: string;
  inputSchema: JSONSchema;
  handler: ToolHandler;
}
