export interface FindTasksByDateInput {
  /** The start date to get the tasks for. Format: YYYY-MM-DD or 'today'. */
  startDate?: string;
  /** How to handle overdue tasks. 'overdue-only' to get only overdue tasks, 'include-overdue' to include overdue tasks along with tasks for the specified date(s), and 'exclude-overdue' to exclude overdue tasks. Default is 'include-overdue'. */
  overdueOption?: "overdue-only" | "include-overdue" | "exclude-overdue";
  /** The number of days to get the tasks for, starting from the start date. Default is 1 which means only tasks for the start date. */
  daysCount?: number;
  /** The maximum number of tasks to return. */
  limit?: number;
  /** The cursor to get the next page of tasks (cursor is obtained from the previous call to this tool, with the same parameters). */
  cursor?: string;
  /** Find tasks assigned to this user. Can be a user ID, name, or email address. */
  responsibleUser?: string;
  /** How to filter by responsible user when responsibleUser is not provided. "assigned" = only tasks assigned to others; "unassignedOrMe" = only unassigned tasks or tasks assigned to me; "all" = all tasks regardless of assignment. Default is "unassignedOrMe". */
  responsibleUserFiltering?: "assigned" | "unassignedOrMe" | "all";
  /** The labels to filter the tasks by */
  labels?: string[];
  /** The operator to use when filtering by labels. This will dictate whether a task has all labels, or some of them. Default is "or". */
  labelsOperator?: "and" | "or";
}

/**
 * Get tasks by date range. Use startDate 'today' to get today's tasks including overdue items, or provide a specific date/date range.
 */
export async function findTasksByDate(input: FindTasksByDateInput): Promise<string> {
  return call("find-tasks-by-date", input);
}