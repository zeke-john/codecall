/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findTasks({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Find Tasks
 * @description Find tasks by text search, or by project/section/parent container/responsible user. At least one filter must be provided.
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export type TaskPriority = "p1" | "p2" | "p3" | "p4";
export type ResponsibleUserFiltering = "assigned" | "unassignedOrMe" | "all";
export type LabelsOperator = "and" | "or";

export interface FindTasksInput {
  /** The text to search for in tasks. */
  searchText?: string;
  /** Find tasks in this project. Project ID should be an ID string, or the text "inbox", for inbox tasks. */
  projectId?: string;
  /** Find tasks in this section. */
  sectionId?: string;
  /** Find subtasks of this parent task. */
  parentId?: string;
  /** Find tasks assigned to this user. Can be a user ID, name, or email address. */
  responsibleUser?: string;
  /** How to filter by responsible user when responsibleUser is not provided. "assigned" = only tasks assigned to others; "unassignedOrMe" = only unassigned tasks or tasks assigned to me; "all" = all tasks regardless of assignment. Default value will be `unassignedOrMe`. */
  responsibleUserFiltering?: ResponsibleUserFiltering;
  /** The maximum number of tasks to return. @default 10 @minimum 1 @maximum 100 */
  limit?: number;
  /** The cursor to get the next page of tasks (cursor is obtained from the previous call to this tool, with the same parameters). */
  cursor?: string;
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

export interface FindTasksOutput {
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

export async function findTasks(input: FindTasksInput): Promise<FindTasksOutput>;