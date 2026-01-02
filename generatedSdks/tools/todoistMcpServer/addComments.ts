/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.addComments({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface CommentInput {
  taskId?: string;
  projectId?: string;
  content: string;
}

export interface AddCommentsInput {
  comments: CommentInput[];
}

/**
 * INPUT EXAMPLE:
 * {
 *   "comments": [
 *     {
 *       "projectId": "inbox",
 *       "content": "codecall_test_comment_1715600000"
 *     }
 *   ]
 * }
 *
 * OUTPUT EXAMPLE:
 * "Added 1 project comment"
 */
export async function addComments(input: AddCommentsInput): Promise<string>;