export interface AddProjectsInput {
  /** The array of projects to add. */
  projects: {
    /** The name of the project. */
    name: string;
    /** The ID of the parent project. If provided, creates this as a sub-project. */
    parentId?: string;
    /** Whether the project is a favorite. Defaults to false. */
    isFavorite?: boolean;
    /** The project view style. Defaults to "list". */
    viewStyle?: "list" | "board" | "calendar";
  }[];
}

/**
 * Add one or more new projects.
 */
export async function addProjects(input: AddProjectsInput): Promise<void> {
  return call("add-projects", input);
}