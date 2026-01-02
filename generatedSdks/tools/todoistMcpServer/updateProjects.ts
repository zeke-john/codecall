/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.updateProjects({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface ProjectUpdateInput {
  id: string;
  name?: string;
  isFavorite?: boolean;
  viewStyle?: "list" | "board" | "calendar";
}

export interface UpdateProjectsInput {
  projects: ProjectUpdateInput[];
}

export async function updateProjects(input: UpdateProjectsInput): Promise<string>;