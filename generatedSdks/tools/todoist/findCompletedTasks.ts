/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findCompletedTasks({ since: "2023-01-01", until: "2023-12-31" })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title find-completed-tasks
 * @description Get completed tasks within a date range.
 * @readOnly true
 * @destructive false
 * @idempotent true
 */

export interface FindCompletedTasksInput {
  /** Method to used: "completion" (actual date) or "due" (original due date). Default: "completion". */
  getBy?: "completion" | "due";
  /** Start date (YYYY-MM-DD). */
  since: string;
  /** End date (YYYY-MM-DD). */
  until: string;
  /** Filter by workspace ID. */
  workspaceId?: string;
  /** Filter by project ID. */
  projectId?: string;
  /** Filter by section ID. */
  sectionId?: string;
  /** Filter by parent task ID. */
  parentId?: string;
  /** Filter by assignee. */
  responsibleUser?: string;
  /** Max results (1-200). Default: 50. */
  limit?: number;
  /** Pagination cursor. */
  cursor?: string;
  /** Filter by labels. */
  labels?: string[];
  /** Labels logic: "and" | "or". Default: "or". */
  labelsOperator?: "and" | "or";
}

export interface FindCompletedTasksOutput {
  tasks: any[];
  nextCursor?: string;
  totalCount: number;
  hasMore: boolean;
  appliedFilters: Record<string, any>;
}

export async function findCompletedTasks(input: FindCompletedTasksInput): Promise<FindCompletedTasksOutput>;