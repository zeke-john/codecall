/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.updateComments({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface CommentUpdateInput {
  id: string;
  content: string;
}

export interface UpdateCommentsInput {
  comments: CommentUpdateInput[];
}

export async function updateComments(input: UpdateCommentsInput): Promise<string>;