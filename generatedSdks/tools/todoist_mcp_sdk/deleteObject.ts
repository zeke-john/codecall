export interface DeleteObjectInput {
  /** The type of entity to delete. */
  type: "project" | "section" | "task" | "comment";
  /** The ID of the entity to delete. */
  id: string;
}

/**
 * Delete a project, section, task, or comment by its ID.
 */
export async function deleteObject(input: DeleteObjectInput): Promise<void> {
  return call("delete-object", input);
}