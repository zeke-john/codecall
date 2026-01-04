/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.deleteObject({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Delete Object
 * @description Delete a project, section, task, or comment by its ID.
 * @readOnly false
 * @destructive true
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export type EntityType = "project" | "section" | "task" | "comment";

export interface DeleteObjectInput {
  /** The type of entity to delete. */
  type: EntityType;
  /** The ID of the entity to delete. @minLength 1 */
  id: string;
}

export interface DeletedEntity {
  /** The type of deleted entity. */
  type: EntityType;
  /** The ID of the deleted entity. */
  id: string;
}

export interface DeleteObjectOutput {
  /** Information about the deleted entity. */
  deletedEntity: DeletedEntity;
  /** Whether the deletion was successful. */
  success: boolean;
}

export async function deleteObject(input: DeleteObjectInput): Promise<DeleteObjectOutput>;