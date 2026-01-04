/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.updateProjects({ projects: [{ id: "1", name: "Updated Name" }] })
 *
 * @title update-projects
 * @description Update multiple existing projects.
 * @readOnly false
 * @destructive true
 */

export interface UpdateProjectItem {
  id: string;
  name?: string;
  isFavorite?: boolean;
  viewStyle?: "list" | "board" | "calendar";
}

export interface UpdateProjectsInput {
  projects: UpdateProjectItem[];
}

export interface UpdateProjectsOutput {
  projects: any[];
  totalCount: number;
  updatedProjectIds: string[];
  appliedOperations: { updateCount: number; skippedCount: number; };
}

export async function updateProjects(input: UpdateProjectsInput): Promise<UpdateProjectsOutput>;