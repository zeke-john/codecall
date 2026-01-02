/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.completeTasks({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface CompleteTasksInput {
  /** The IDs of the tasks to complete. */
  ids: string[];
}

export async function completeTasks(input: CompleteTasksInput): Promise<void>;