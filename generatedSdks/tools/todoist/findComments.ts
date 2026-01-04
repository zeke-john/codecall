/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findComments({ taskId: "123" })
 *
 * @title find-comments
 * @description Find comments by task, project, or ID.
 * @readOnly true
 */

export interface FindCommentsInput {
  taskId?: string;
  projectId?: string;
  commentId?: string;
  cursor?: string;
  limit?: number;
}

export interface FindCommentsOutput {
  comments: any[];
  searchType: "single" | "task" | "project";
  searchId: string;
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
}

export async function findComments(input: FindCommentsInput): Promise<FindCommentsOutput>;