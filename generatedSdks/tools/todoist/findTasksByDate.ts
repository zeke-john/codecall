/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findTasksByDate({ startDate: "today" })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title find-tasks-by-date
 * @description Get tasks by date range. Use startDate 'today' to get today's tasks.
 * @readOnly true
 * @destructive false
 * @idempotent true
 */

export interface FindTasksByDateInput {
  /** Start date (YYYY-MM-DD or 'today'). */
  startDate?: string;
  /** Overdue handling: 'overdue-only', 'include-overdue', 'exclude-overdue'. Default: 'include-overdue'. */
  overdueOption?: "overdue-only" | "include-overdue" | "exclude-overdue";
  /** Number of days from start date (1-30). Default: 1. */
  daysCount?: number;
  /** Max results (1-100). Default: 10. */
  limit?: number;
  /** Pagination cursor. */
  cursor?: string;
  /** Filter by assignee. */
  responsibleUser?: string;
  /** Assignment filter logic. Default: "unassignedOrMe". */
  responsibleUserFiltering?: "assigned" | "unassignedOrMe" | "all";
  /** Filter by labels. */
  labels?: string[];
  /** Labels logic: "and" | "or". Default: "or". */
  labelsOperator?: "and" | "or";
}

export interface FindTasksByDateOutput {
  tasks: any[];
  nextCursor?: string;
  totalCount: number;
  hasMore: boolean;
  appliedFilters: Record<string, any>;
}

export async function findTasksByDate(input: FindTasksByDateInput): Promise<FindTasksByDateOutput>;