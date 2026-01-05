/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findCompletedTasks({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Find Completed Tasks
 * @description Get completed tasks (includes all collaborators by default—use responsibleUser to narrow).
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  @CC LEARNED CONSTRAINT                                                   ║
 * ║  The Todoist API returns "completion date range must not exceed 3 months" ║
 * ║  error (HTTP 400) when querying completed tasks. The `since` and `until`  ║
 * ║  date range MUST be within 3 months of each other. To get all-time        ║
 * ║  completed tasks, you must iterate in 3-month chunks from the start date  ║
 * ║  to today.                                                                ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

export type TaskPriority = "p1" | "p2" | "p3" | "p4";
export type GetBy = "completion" | "due";
export type LabelsOperator = "and" | "or";

export interface FindCompletedTasksInput {
  /** The method to use to get the tasks: "completion" to get tasks by completion date (ie, when the task was actually completed), "due" to get tasks by due date (ie, when the task was due to be completed by). @default "completion" */
  getBy?: GetBy;
  /** The start date to get the tasks for. Format: YYYY-MM-DD. @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$ @pattern ^\d{4}-\d{2}-\d{2}$ */
  since: string;
  /** The start date to get the tasks for. Format: YYYY-MM-DD. @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$ @pattern ^\d{4}-\d{2}-\d{2}$ */
  until: string;
  /** The ID of the workspace to get the tasks for. */
  workspaceId?: string;
  /** The ID of the project to get the tasks for. Project ID should be an ID string, or the text "inbox", for inbox tasks. */
  projectId?: string;
  /** The ID of the section to get the tasks for. */
  sectionId?: string;
  /** The ID of the parent task to get the tasks for. */
  parentId?: string;
  /** Find tasks assigned to this user. Can be a user ID, name, or email address. Defaults to all collaborators when omitted. */
  responsibleUser?: string;
  /** The maximum number of tasks to return. @default 50 @minimum 1 @maximum 200 */
  limit?: number;
  /** The cursor to get the next page of tasks (cursor is obtained from the previous call to this tool, with the same parameters). */
  cursor?: string;
  /** The labels to filter the tasks by */
  labels?: string[];
  /** The operator to use when filtering by labels. This will dictate whether a task has all labels, or some of them. Default is "or". */
  labelsOperator?: LabelsOperator;
}

export interface CompletedTask {
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

export interface FindCompletedTasksOutput {
  /** The found completed tasks. */
  tasks: CompletedTask[];
  /** Cursor for the next page of results. */
  nextCursor?: string;
  /** The total number of tasks in this page. */
  totalCount: number;
  /** Whether there are more results available. */
  hasMore: boolean;
  /** The filters that were applied to the search. */
  appliedFilters: Record<string, any>;
}

export async function findCompletedTasks(
  input: FindCompletedTasksInput
): Promise<FindCompletedTasksOutput>;
