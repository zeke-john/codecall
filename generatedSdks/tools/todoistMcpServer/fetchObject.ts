/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.fetchObject({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface FetchObjectInput {
  type: "task" | "project" | "comment" | "section";
  id: string;
}

export async function fetchObject(input: FetchObjectInput): Promise<any>;