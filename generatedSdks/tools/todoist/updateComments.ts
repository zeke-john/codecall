/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.updateComments({ comments: [{ id: "1", content: "New" }] })
 *
 * @title update-comments
 * @description Update existing comments.
 * @readOnly false
 * @destructive true
 */

export interface UpdateCommentItem {
  id: string;
  content: string;
}

export interface UpdateCommentsInput {
  comments: UpdateCommentItem[];
}

export interface UpdateCommentsOutput {
  comments: any[];
  totalCount: number;
  updatedCommentIds: string[];
  appliedOperations: { updateCount: number };
}

export async function updateComments(input: UpdateCommentsInput): Promise<UpdateCommentsOutput>;