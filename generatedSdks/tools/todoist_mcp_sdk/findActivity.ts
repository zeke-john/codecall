export interface FindActivityInput {
  /** Type of object to filter by. */
  objectType?: "task" | "project" | "comment";
  /** Filter by specific object ID (task, project, or comment). */
  objectId?: string;
  /** Type of event to filter by. */
  eventType?: "added" | "updated" | "deleted" | "completed" | "uncompleted" | "archived" | "unarchived" | "shared" | "left";
  /** Filter events by parent project ID. */
  projectId?: string;
  /** Filter events by parent task ID (for subtask events). */
  taskId?: string;
  /** Filter by the user ID who initiated the event. */
  initiatorId?: string;
  /** Maximum number of activity events to return. */
  limit?: number;
  /** Pagination cursor for retrieving the next page of results. */
  cursor?: string;
}

/**
 * Retrieve recent activity logs to monitor and audit changes in Todoist. Shows events from all users by default (use initiatorId to filter by specific user). Track task completions, updates, deletions, project changes, and more with flexible filtering. Note: Date-based filtering is not supported by the Todoist API.
 */
export async function findActivity(input: FindActivityInput): Promise<string> {
  return call("find-activity", input);
}