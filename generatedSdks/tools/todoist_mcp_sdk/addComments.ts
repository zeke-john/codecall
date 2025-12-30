export interface AddCommentsInput {
  /** The array of comments to add. */
  comments: {
    /** The ID of the task to comment on. */
    taskId?: string;
    /** The ID of the project to comment on. Project ID should be an ID string, or the text "inbox", for inbox tasks. */
    projectId?: string;
    /** The content of the comment. */
    content: string;
  }[];
}

/**
 * Add multiple comments to tasks or projects. Each comment must specify either taskId or projectId.
 */
export async function addComments(input: AddCommentsInput): Promise<void> {
  return call("add-comments", input);
}