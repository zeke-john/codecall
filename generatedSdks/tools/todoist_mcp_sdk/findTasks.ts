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
  responsibleUserFiltering?: "assigned" | "unassignedOrMe" | "all";
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
 * Find tasks by text search, or by project/section/parent container/responsible user. At least one filter must be provided.
 */
export async function findTasks(input: FindTasksInput): Promise<any> {
  return call("find-tasks", input);
}