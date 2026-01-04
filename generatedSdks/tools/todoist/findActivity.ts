/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findActivity({ objectType: "task", eventType: "completed" })
 *
 * @title find-activity
 * @description Retrieve recent activity logs.
 * @readOnly true
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

export interface FindActivityOutput {
  events: any[];
  nextCursor?: string;
  totalCount: number;
  hasMore: boolean;
  appliedFilters: Record<string, any>;
}

export async function findActivity(input: FindActivityInput): Promise<FindActivityOutput>;