export interface CompleteTasksInput {
  /** The IDs of the tasks to complete. */
  ids: string[];
}

/**
 * Complete one or more tasks by their IDs.
 */
export async function completeTasks(input: CompleteTasksInput): Promise<void> {
  return call("complete-tasks", input);
}