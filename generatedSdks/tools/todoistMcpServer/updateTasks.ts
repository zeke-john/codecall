/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.updateTasks({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface TaskUpdateInput {
  id: string;
  content?: string;
  description?: string;
  projectId?: string;
  sectionId?: string;
  parentId?: string;
  order?: number;
  priority?: "p1" | "p2" | "p3" | "p4";
  dueString?: string;
  deadlineDate?: string;
  duration?: string;
  responsibleUser?: string;
  labels?: string[];
  isUncompletable?: boolean;
}

export interface UpdateTasksInput {
  tasks: TaskUpdateInput[];
}

export async function updateTasks(input: UpdateTasksInput): Promise<string>;