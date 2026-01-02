/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.findCompletedTasks({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface FindCompletedTasksInput {
  getBy?: "completion" | "due";
  /** Start date (YYYY-MM-DD). */
  since: string;
  /** End date (YYYY-MM-DD). */
  until: string;
  workspaceId?: string;
  projectId?: string;
  sectionId?: string;
  parentId?: string;
  responsibleUser?: string;
  limit?: number;
  cursor?: string;
  labels?: string[];
  labelsOperator?: "and" | "or";
}

export async function findCompletedTasks(input: FindCompletedTasksInput): Promise<string>;