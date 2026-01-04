/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.addProjects({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Add Projects
 * @description Add one or more new projects.
 * @readOnly false
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export type ViewStyle = "list" | "board" | "calendar";

export interface ProjectToAdd {
  /** The name of the project. @minLength 1 */
  name: string;
  /** The ID of the parent project. If provided, creates this as a sub-project. */
  parentId?: string;
  /** Whether the project is a favorite. Defaults to false. */
  isFavorite?: boolean;
  /** The project view style. Defaults to "list". */
  viewStyle?: ViewStyle;
}

export interface AddProjectsInput {
  /** The array of projects to add. @minItems 1 */
  projects: ProjectToAdd[];
}

export interface CreatedProject {
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

export interface AddProjectsOutput {
  /** The created projects. */
  projects: CreatedProject[];
  /** The total number of projects created. */
  totalCount: number;
}

export async function addProjects(input: AddProjectsInput): Promise<AddProjectsOutput>;