/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.addTasks({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Add Tasks
 * @description Add one or more tasks to a project, section, or parent. Supports assignment to project collaborators.
 * @readOnly false
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export type TaskPriority = "p1" | "p2" | "p3" | "p4";

export interface TaskToAdd {
  /** The task name/title. Should be concise and actionable (e.g., "Review PR #123", "Call dentist"). For longer content, use the description field instead. Supports Markdown. @minLength 1 */
  content: string;
  /** Additional details, notes, or context for the task. Use this for longer content rather than putting it in the task name. Supports Markdown. */
  description?: string;
  /** The priority of the task: p1 (highest), p2 (high), p3 (medium), p4 (lowest/default). */
  priority?: TaskPriority;
  /** The due date for the task, in natural language ONLY (e.g. "today", "tomorrow at 9am", "Jan 15", "in 3 days", "every monday", "every weekday at 10am"); no ISO dates or structured formats are accepted. NOTE: Use simple phrases like "tomorrow", "in 2 days", "next monday". Avoid compound phrases like "day after tomorrow" which may not be parsed correctly. This is the INPUT field - the output returns `dueDate` in ISO format. */
  dueString?: string;
  /** The deadline date for the task in ISO 8601 format (YYYY-MM-DD, e.g., "2025-12-31"). Deadlines are immovable constraints shown with a different indicator than due dates. */
  deadlineDate?: string;
  /** The duration of the task. Use format: "2h" (hours), "90m" (minutes), "2h30m" (combined), or "1.5h" (decimal hours). Max 24h. */
  duration?: string;
  /** The labels to attach to the task. */
  labels?: string[];
  /** The project ID to add this task to. Project ID should be an ID string, or the text "inbox", for inbox tasks. */
  projectId?: string;
  /** The section ID to add this task to. */
  sectionId?: string;
  /** The parent task ID (for subtasks). */
  parentId?: string;
  /** Assign task to this user. Can be a user ID, name, or email address. User must be a collaborator on the target project. */
  responsibleUser?: string;
  /** Whether this task should be uncompletable (organizational header). Tasks with isUncompletable: true appear as organizational headers and cannot be completed. */
  isUncompletable?: boolean;
}

export interface AddTasksInput {
  /** The array of tasks to add. @minItems 1 */
  tasks: TaskToAdd[];
}

export interface CreatedTask {
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

export interface AddTasksOutput {
  /** The created tasks. */
  tasks: CreatedTask[];
  /** The total number of tasks created. */
  totalCount: number;
}

export async function addTasks(input: AddTasksInput): Promise<AddTasksOutput>;
