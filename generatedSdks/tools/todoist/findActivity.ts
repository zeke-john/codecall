/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findActivity({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Find Activity
 * @description Retrieve recent activity logs to monitor and audit changes in Todoist. Shows events from all users by default (use initiatorId to filter by specific user). Track task completions, updates, deletions, project changes, and more with flexible filtering. Note: Date-based filtering is not supported by the Todoist API.
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export type ObjectType = "task" | "project" | "comment";
export type EventType = "added" | "updated" | "deleted" | "completed" | "uncompleted" | "archived" | "unarchived" | "shared" | "left";

export interface FindActivityInput {
  /** Type of object to filter by. */
  objectType?: ObjectType;
  /** Filter by specific object ID (task, project, or comment). */
  objectId?: string;
  /** Type of event to filter by. */
  eventType?: EventType;
  /** Filter events by parent project ID. */
  projectId?: string;
  /** Filter events by parent task ID (for subtask events). */
  taskId?: string;
  /** Filter by the user ID who initiated the event. */
  initiatorId?: string;
  /** Maximum number of activity events to return. @default 20 @minimum 1 @maximum 100 */
  limit?: number;
  /** Pagination cursor for retrieving the next page of results. */
  cursor?: string;
}

export interface ActivityEvent {
  /** The unique ID of the activity event. */
  id?: string;
  /** The type of object this event relates to (task, project, etc). */
  objectType: string;
  /** The ID of the object this event relates to. */
  objectId: string;
  /** The type of event (added, updated, deleted, completed, etc). */
  eventType: string;
  /** When the event occurred (ISO 8601 format). */
  eventDate: string;
  /** The ID of the parent project. */
  parentProjectId?: string;
  /** The ID of the parent item. */
  parentItemId?: string;
  /** The ID of the user who initiated this event. */
  initiatorId?: string;
  /** Additional event data. */
  extraData?: Record<string, any>;
}

export interface FindActivityOutput {
  /** The activity events. */
  events: ActivityEvent[];
  /** Cursor for the next page of results. */
  nextCursor?: string;
  /** The total number of events in this page. */
  totalCount: number;
  /** Whether there are more results available. */
  hasMore: boolean;
  /** The filters that were applied to the search. */
  appliedFilters: Record<string, any>;
}

export async function findActivity(input: FindActivityInput): Promise<FindActivityOutput>;