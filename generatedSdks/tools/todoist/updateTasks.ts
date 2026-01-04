/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.updateTasks({ tasks: [{ id: "123", content: "Updated" }] })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title update-tasks
 * @description Update existing tasks including content, dates, priorities, and assignments.
 * @readOnly false
 * @destructive true
 * @idempotent false
 */

export interface UpdateTaskItem {
  /** The ID of the task to update. */
  id: string;
  /** The new task name/title. Supports Markdown. */
  content?: string;
  /** New additional details, notes, or context. Supports Markdown. */
  description?: string;
  /** The new project ID for the task. Use "inbox" for inbox. */
  projectId?: string;
  /** The new section ID for the task. */
  sectionId?: string;
  /** The new parent task ID (for subtasks). */
  parentId?: string;
  /** The new order of the task within its parent/section. */
  order?: number;
  /** The new priority: p1, p2, p3, p4. */
  priority?: "p1" | "p2" | "p3" | "p4";
  /** New deadline date in ISO 8601. Use "remove" to clear. */
  deadlineDate?: string;
  /** Duration string: "2h", "90m", etc. */
  duration?: string;
  /** Change task assignment. Use "unassign" to remove. */
  responsibleUser?: string;
  /** New labels (replaces existing). */
  labels?: string[];
  /** Whether this task should be an uncompletable organizational header. */
  isUncompletable?: boolean;
}

export interface UpdateTasksInput {
  /** The tasks to update. */
  tasks: UpdateTaskItem[];
}

export interface UpdateTasksOutput {
  /** The updated tasks. */
  tasks: any[];
  /** The total number of tasks updated. */
  totalCount: number;
  /** The IDs of the updated tasks. */
  updatedTaskIds: string[];
  /** Summary of operations performed. */
  appliedOperations: {
    updateCount: number;
    skippedCount: number;
  };
}

export async function updateTasks(
  input: UpdateTasksInput
): Promise<UpdateTasksOutput>;
