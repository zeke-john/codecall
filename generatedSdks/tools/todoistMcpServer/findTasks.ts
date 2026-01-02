/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.findTasks({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface FindTasksInput {
  searchText?: string;
  projectId?: string;
  sectionId?: string;
  parentId?: string;
  responsibleUser?: string;
  responsibleUserFiltering?: "assigned" | "unassignedOrMe" | "all";
  limit?: number;
  cursor?: string;
  labels?: string[];
  labelsOperator?: "and" | "or";
}

export async function findTasks(input: FindTasksInput): Promise<string>;