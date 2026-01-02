/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.addProjects({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface ProjectInput {
  name: string;
  parentId?: string;
  isFavorite?: boolean;
  viewStyle?: "list" | "board" | "calendar";
}

export interface AddProjectsInput {
  projects: ProjectInput[];
}

/**
 * INPUT EXAMPLE:
 * {
 *   "projects": [
 *     {
 *       "name": "codecall_test_project_1715600000",
 *       "viewStyle": "list"
 *     }
 *   ]
 * }
 *
 * OUTPUT EXAMPLE:
 * "Added 1 project:\n• codecall_test_project_1715600000 (id=6fgP32WMQjH7Fcqq)"
 */
export async function addProjects(input: AddProjectsInput): Promise<string>;