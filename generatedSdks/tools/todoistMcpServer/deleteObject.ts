/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.deleteObject({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface DeleteObjectInput {
  type: "project" | "section" | "task" | "comment";
  id: string;
}

export async function deleteObject(input: DeleteObjectInput): Promise<void>;