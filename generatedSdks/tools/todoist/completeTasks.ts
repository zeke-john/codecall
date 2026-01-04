/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.completeTasks({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Complete Tasks
 * @description Complete one or more tasks by their IDs.
 * @readOnly false
 * @destructive true
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface CompleteTasksInput {
  /** The IDs of the tasks to complete. @minItems 1 @minLength 1 */
  ids: string[];
}

export interface TaskCompletionFailure {
  /** The item that failed (usually an ID or identifier). */
  item: string;
  /** The error message. */
  error: string;
  /** The error code, if available. */
  code?: string;
}

export interface CompleteTasksOutput {
  /** The IDs of successfully completed tasks. */
  completed: string[];
  /** Failed task completions with error details. */
  failures: TaskCompletionFailure[];
  /** The total number of tasks requested to complete. */
  totalRequested: number;
  /** The number of successfully completed tasks. */
  successCount: number;
  /** The number of failed task completions. */
  failureCount: number;
}

export async function completeTasks(input: CompleteTasksInput): Promise<CompleteTasksOutput>;