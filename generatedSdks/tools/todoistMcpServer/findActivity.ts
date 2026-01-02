/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.findActivity({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface FindActivityInput {
  objectType?: "task" | "project" | "comment";
  objectId?: string;
  eventType?: "added" | "updated" | "deleted" | "completed" | "uncompleted" | "archived" | "unarchived" | "shared" | "left";
  projectId?: string;
  taskId?: string;
  initiatorId?: string;
  limit?: number;
  cursor?: string;
}

/**
 * INPUT EXAMPLE:
 * {
 *   "limit": 20
 * }
 *
 * OUTPUT EXAMPLE:
 * "Activity events: 9 (limit 20).\nPreview:\n    [Dec 29, 10:22] updated task • \"codecall_test_1715634000\" • id=6ffQ6XJc6vwC7qgv • by=36927342 • project=6GrP7ffcmf2cxqwv\n    // ... more items"
 */
export async function findActivity(input: FindActivityInput): Promise<string>;