export interface FindCommentsInput {
  /** Find comments for a specific task. */
  taskId?: string;
  /** Find comments for a specific project. Project ID should be an ID string, or the text "inbox", for inbox tasks. */
  projectId?: string;
  /** Get a specific comment by ID. */
  commentId?: string;
  /** Pagination cursor for retrieving more results. */
  cursor?: string;
  /** Maximum number of comments to return */
  limit?: number;
}

/**
 * Find comments by task, project, or get a specific comment by ID. Exactly one of taskId, projectId, or commentId must be provided.
 */
export async function findComments(input: FindCommentsInput): Promise<string> {
  return call("find-comments", input);
}