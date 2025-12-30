export interface UpdateTasksInput {
  /** The tasks to update. */
  tasks: {
    /** The ID of the task to update. */
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
    priority?: "p1" | "p2" | "p3" | "p4";
    /** The new due date for the task, in natural language (e.g., 'tomorrow at 5pm'). */
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
  }[];
}

/**
 * Update existing tasks including content, dates, priorities, and assignments.
 */
export async function updateTasks(input: UpdateTasksInput): Promise<void> {
  return call("update-tasks", input);
}