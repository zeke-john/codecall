export interface AddTasksInput {
  /** The array of tasks to add. */
  tasks: {
    /** The task name/title. Should be concise and actionable (e.g., "Review PR #123", "Call dentist"). For longer content, use the description field instead. Supports Markdown. */
    content: string;
    /** Additional details, notes, or context for the task. Use this for longer content rather than putting it in the task name. Supports Markdown. */
    description?: string;
    /** The priority of the task: p1 (highest), p2 (high), p3 (medium), p4 (lowest/default). */
    priority?: "p1" | "p2" | "p3" | "p4";
    /** The due date for the task, in natural language. */
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
  }[];
}

/**
 * Add one or more tasks to a project, section, or parent. Supports assignment to project collaborators.
 */
export async function addTasks(input: AddTasksInput): Promise<void> {
  return call("add-tasks", input);
}