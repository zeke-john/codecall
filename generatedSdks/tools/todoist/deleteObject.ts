/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.deleteObject({ type: "task", id: "123" })
 *
 * @title delete-object
 * @description Delete a project, section, task, or comment by ID.
 * @readOnly false
 * @destructive true
 */

export interface DeleteObjectInput {
  type: "project" | "section" | "task" | "comment";
  id: string;
}

export interface DeleteObjectOutput {
  deletedEntity: { type: string; id: string };
  success: boolean;
}

export async function deleteObject(input: DeleteObjectInput): Promise<DeleteObjectOutput>;