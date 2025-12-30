export interface UpdateProjectsInput {
  /** The projects to update. */
  projects: {
    /** The ID of the project to update. */
    id: string;
    /** The new name of the project. */
    name?: string;
    /** Whether the project is a favorite. */
    isFavorite?: boolean;
    /** The project view style. */
    viewStyle?: "list" | "board" | "calendar";
  }[];
}

/**
 * Update multiple existing projects with new values.
 */
export async function updateProjects(input: UpdateProjectsInput): Promise<void> {
  return call("update-projects", input);
}