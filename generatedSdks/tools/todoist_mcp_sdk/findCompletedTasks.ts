export interface FindCompletedTasksInput {
  /** The method to use to get the tasks: "completion" to get tasks by completion date (ie, when the task was actually completed), "due" to get tasks by due date (ie, when the task was due to be completed by). */
  getBy?: "completion" | "due";
  /** The start date to get the tasks for. Format: YYYY-MM-DD. */
  since: string;
  /** The start date to get the tasks for. Format: YYYY-MM-DD. */
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
  /** The maximum number of tasks to return. */
  limit?: number;
  /** The cursor to get the next page of tasks (cursor is obtained from the previous call to this tool, with the same parameters). */
  cursor?: string;
  /** The labels to filter the tasks by */
  labels?: string[];
  /** The operator to use when filtering by labels. This will dictate whether a task has all labels, or some of them. Default is "or". */
  labelsOperator?: "and" | "or";
}

/**
 * Get completed tasks (includes all collaborators by default—use responsibleUser to narrow).
 */
export async function findCompletedTasks(input: FindCompletedTasksInput): Promise<any> {
  return call("find-completed-tasks", input);
}