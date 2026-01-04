/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.addProjects({ projects: [{ name: "New Project" }] })
 *
 * @title add-projects
 * @description Add one or more new projects.
 * @readOnly false
 * @destructive false
 */

export interface ProjectInput {
  /** The name of the project. */
  name: string;
  /** Parent project ID. */
  parentId?: string;
  /** Is a favorite? Default: false. */
  isFavorite?: boolean;
  /** View style: "list", "board", "calendar". Default: "list". */
  viewStyle?: "list" | "board" | "calendar";
}

export interface AddProjectsInput {
  projects: ProjectInput[];
}

export interface AddProjectsOutput {
  projects: any[];
  totalCount: number;
}

export async function addProjects(input: AddProjectsInput): Promise<AddProjectsOutput>;