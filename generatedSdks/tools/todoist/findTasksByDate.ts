/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findTasksByDate({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Find Tasks By Date
 * @description Get tasks by date range. Use startDate 'today' to get today's tasks including overdue items, or provide a specific date/date range.
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export type TaskPriority = "p1" | "p2" | "p3" | "p4";
export type OverdueOption = "overdue-only" | "include-overdue" | "exclude-overdue";
export type ResponsibleUserFiltering = "assigned" | "unassignedOrMe" | "all";
export type LabelsOperator = "and" | "or";

export interface FindTasksByDateInput {
  /** The start date to get the tasks for. Format: YYYY-MM-DD or 'today'. @pattern ^(\d{4}-\d{2}-\d{2}|today)$ */
  startDate?: string;
  /** How to handle overdue tasks. 'overdue-only' to get only overdue tasks, 'include-overdue' to include overdue tasks along with tasks for the specified date(s), and 'exclude-overdue' to exclude overdue tasks. Default is 'include-overdue'. */
  overdueOption?: OverdueOption;
  /** The number of days to get the tasks for, starting from the start date. Default is 1 which means only tasks for the start date. @default 1 @minimum 1 @maximum 30 */
  daysCount?: number;
  /** The maximum number of tasks to return. @default 10 @minimum 1 @maximum 100 */
  limit?: number;
  /** The cursor to get the next page of tasks (cursor is obtained from the previous call to this tool, with the same parameters). */
  cursor?: string;
  /** Find tasks assigned to this user. Can be a user ID, name, or email address. */
  responsibleUser?: string;
  /** How to filter by responsible user when responsibleUser is not provided. "assigned" = only tasks assigned to others; "unassignedOrMe" = only unassigned tasks or tasks assigned to me; "all" = all tasks regardless of assignment. Default is "unassignedOrMe". */
  responsibleUserFiltering?: ResponsibleUserFiltering;
  /** The labels to filter the tasks by */
  labels?: string[];
  /** The operator to use when filtering by labels. This will dictate whether a task has all labels, or some of them. Default is "or". */
  labelsOperator?: LabelsOperator;
}

export interface FoundTask {
  /** The unique ID of the task. */
  id: string;
  /** The task title/content. */
  content: string;
  /** The task description. */
  description: string;
  /** The due date of the task (ISO 8601 format). */
  dueDate?: string;
  /** Whether the task is recurring, or the recurrence string. */
  recurring: boolean | string;
  /** The deadline date of the task (ISO 8601 format). */
  deadlineDate?: string;
  /** The priority level: p1 (highest), p2 (high), p3 (medium), p4 (lowest). */
  priority: TaskPriority;
  /** The ID of the project this task belongs to. */
  projectId: string;
  /** The ID of the section this task belongs to. */
  sectionId?: string;
  /** The ID of the parent task (for subtasks). */
  parentId?: string;
  /** The labels attached to this task. */
  labels?: string[];
  /** The duration of the task (e.g., "2h30m"). */
  duration?: string;
  /** The UID of the user responsible for this task. */
  responsibleUid?: string;
  /** Whether the task is uncompletable (organizational header). */
  isUncompletable?: boolean;
  /** The UID of the user who assigned this task. */
  assignedByUid?: string;
  /** Whether the task is checked/completed. */
  checked: boolean;
  /** When the task was completed (ISO 8601 format). */
  completedAt?: string;
}

export interface FindTasksByDateOutput {
  /** The found tasks. */
  tasks: FoundTask[];
  /** Cursor for the next page of results. */
  nextCursor?: string;
  /** The total number of tasks in this page. */
  totalCount: number;
  /** Whether there are more results available. */
  hasMore: boolean;
  /** The filters that were applied to the search. */
  appliedFilters: Record<string, any>;
}

export async function findTasksByDate(input: FindTasksByDateInput): Promise<FindTasksByDateOutput>;