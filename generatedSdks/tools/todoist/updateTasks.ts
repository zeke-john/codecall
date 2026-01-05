/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.updateTasks({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Update Tasks
 * @description Update existing tasks including content, dates, priorities, and assignments.
 * @readOnly false
 * @destructive true
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export type TaskPriority = "p1" | "p2" | "p3" | "p4";

export interface TaskToUpdate {
  /** The ID of the task to update. @minLength 1 */
  id: string;
  /** The new task name/title. Should be concise and actionable (e.g., "Review PR #123", "Call dentist"). For longer content, use the description field instead. Supports Markdown. */
  content?: string;
  /** New additional details, notes, or context for the task. Use this for longer content rather than putting it in the task name. Supports Markdown. */
  description?: string;
  /** The new project ID for the task. Project ID should be an ID string, or the text "inbox", for inbox tasks. */
  projectId?: string;
  /** The new section ID for the task. */
  sectionId?: string;
  /** The new parent task ID (for subtasks). */
  parentId?: string;
  /** The new order of the task within its parent/section. */
  order?: number;
  /** The new priority of the task: p1 (highest), p2 (high), p3 (medium), p4 (lowest/default). */
  priority?: TaskPriority;
  /** The due date for the task, in natural language ONLY (e.g. "today", "tomorrow at 9am", "Jan 15", "in 3 days", "every monday", "every weekday at 10am"); no ISO dates or structured formats are accepted.
   * NOTE: ONLY use simple phrases like "tomorrow", "in x days", "next monday". NEVER compound phrases like "day after tomorrow" which will not be parsed correctly. */
  dueString?: string;
  /** The new deadline date for the task in ISO 8601 format (YYYY-MM-DD, e.g., "2025-12-31"). Deadlines are immovable constraints shown with a different indicator than due dates. Use "remove" to clear the deadline. */
  deadlineDate?: string;
  /** The duration of the task. Use format: "2h" (hours), "90m" (minutes), "2h30m" (combined), or "1.5h" (decimal hours). Max 24h. */
  duration?: string;
  /** Change task assignment. Use "unassign" to remove assignment. Can be user ID, name, or email. User must be a project collaborator. */
  responsibleUser?: string;
  /** The new labels for the task. Replaces all existing labels. */
  labels?: string[];
  /** Whether this task should be uncompletable (organizational header). Tasks with isUncompletable: true appear as organizational headers and cannot be completed. */
  isUncompletable?: boolean;
}

export interface UpdateTasksInput {
  /** The tasks to update. @minItems 1 */
  tasks: TaskToUpdate[];
}

export interface UpdatedTask {
  /** The unique ID of the task. */
  id: string;
  /** The task title/content. */
  content: string;
  /** The task description. */
  description: string;
  /** The due date of the task (ISO 8601 format). OUTPUT ONLY - to set a due date, use `dueString` in the input with natural language. */
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

export interface AppliedOperations {
  /** The number of tasks actually updated. */
  updateCount: number;
  /** The number of tasks skipped (no changes). */
  skippedCount: number;
}

export interface UpdateTasksOutput {
  /** The updated tasks. */
  tasks: UpdatedTask[];
  /** The total number of tasks updated. */
  totalCount: number;
  /** The IDs of the updated tasks. */
  updatedTaskIds: string[];
  /** Summary of operations performed. */
  appliedOperations: AppliedOperations;
}

export async function updateTasks(
  input: UpdateTasksInput
): Promise<UpdateTasksOutput>;
