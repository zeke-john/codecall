/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.findComments({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface FindCommentsInput {
  taskId?: string;
  projectId?: string;
  commentId?: string;
  cursor?: string;
  limit?: number;
}

/**
 * INPUT EXAMPLE:
 * {
 *   "projectId": "inbox",
 *   "limit": 10
 * }
 *
 * OUTPUT EXAMPLE:
 * "Found 1 comment for project inbox"
 */
export async function findComments(input: FindCommentsInput): Promise<string>;