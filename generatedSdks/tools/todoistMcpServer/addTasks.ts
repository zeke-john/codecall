/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.addTasks({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface TaskInput {
  /** The task name/title. Should be concise and actionable. Supports Markdown. */
  content: string;
  /** Additional details, notes, or context for the task. Supports Markdown. */
  description?: string;
  /** The priority of the task: p1 (highest) to p4 (default). */
  priority?: "p1" | "p2" | "p3" | "p4";
  /** The due date for the task, in natural language. */
  dueString?: string;
  /** The deadline date for the task in ISO 8601 format (YYYY-MM-DD). */
  deadlineDate?: string;
  /** The duration of the task (e.g., "2h", "90m"). Max 24h. */
  duration?: string;
  /** The labels to attach to the task. */
  labels?: string[];
  /** The project ID or "inbox". */
  projectId?: string;
  /** The section ID to add this task to. */
  sectionId?: string;
  /** The parent task ID (for subtasks). */
  parentId?: string;
  /** User ID, name, or email of collaborator. */
  responsibleUser?: string;
  /** Whether this task is an organizational header. */
  isUncompletable?: boolean;
}

export interface AddTasksInput {
  tasks: TaskInput[];
}

/**
 * INPUT EXAMPLE:
 * {
 *   "tasks": [
 *     {
 *       "content": "codecall_test_1715600000",
 *       "description": "Initial test task for verification",
 *       "priority": "p4",
 *       "projectId": "inbox"
 *     }
 *   ]
 * }
 *
 * OUTPUT EXAMPLE:
 * "Added 1 task to projects.\nTasks:\n    codecall_test_1715600000 • P4 • id=6fgP32P2Qm4q6cMM."
 */
export async function addTasks(input: AddTasksInput): Promise<string>;