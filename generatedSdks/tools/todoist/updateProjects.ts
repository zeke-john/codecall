/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.updateProjects({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Update Projects
 * @description Update multiple existing projects with new values.
 * @readOnly false
 * @destructive true
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export type ViewStyle = "list" | "board" | "calendar";

export interface ProjectToUpdate {
  /** The ID of the project to update. @minLength 1 */
  id: string;
  /** The new name of the project. @minLength 1 */
  name?: string;
  /** Whether the project is a favorite. */
  isFavorite?: boolean;
  /** The project view style. */
  viewStyle?: ViewStyle;
}

export interface UpdateProjectsInput {
  /** The projects to update. @minItems 1 */
  projects: ProjectToUpdate[];
}

export interface UpdatedProject {
  /** The unique ID of the project. */
  id: string;
  /** The name of the project. */
  name: string;
  /** The color of the project. */
  color: string;
  /** Whether the project is marked as favorite. */
  isFavorite: boolean;
  /** Whether the project is shared. */
  isShared: boolean;
  /** The ID of the parent project (for sub-projects). */
  parentId?: string;
  /** Whether this is the inbox project. */
  inboxProject: boolean;
  /** The view style of the project (list, board, calendar). */
  viewStyle: string;
}

export interface ProjectAppliedOperations {
  /** The number of projects actually updated. */
  updateCount: number;
  /** The number of projects skipped (no changes). */
  skippedCount: number;
}

export interface UpdateProjectsOutput {
  /** The updated projects. */
  projects: UpdatedProject[];
  /** The total number of projects updated. */
  totalCount: number;
  /** The IDs of the updated projects. */
  updatedProjectIds: string[];
  /** Summary of operations performed. */
  appliedOperations: ProjectAppliedOperations;
}

export async function updateProjects(input: UpdateProjectsInput): Promise<UpdateProjectsOutput>;