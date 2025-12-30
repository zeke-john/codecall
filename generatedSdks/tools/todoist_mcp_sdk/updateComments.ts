export interface UpdateCommentsInput {
  /** The comments to update. */
  comments: {
    /** The ID of the comment to update. */
    id: string;
    /** The new content for the comment. */
    content: string;
  }[];
}

/**
 * Update multiple existing comments with new content.
 */
export async function updateComments(input: UpdateCommentsInput): Promise<void> {
  return call("update-comments", input);
}