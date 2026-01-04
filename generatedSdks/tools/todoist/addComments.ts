/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.addComments({ comments: [{ taskId: "1", content: "Note" }] })
 *
 * @title add-comments
 * @description Add multiple comments to tasks or projects.
 * @readOnly false
 */

export interface CommentInput {
  taskId?: string;
  projectId?: string;
  content: string;
}

export interface AddCommentsInput {
  comments: CommentInput[];
}

export interface AddCommentsOutput {
  comments: any[];
  totalCount: number;
  addedCommentIds: string[];
}

export async function addComments(input: AddCommentsInput): Promise<AddCommentsOutput>;