/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.fetchObject({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Fetch Object
 * @description Fetch a single task, project, comment, or section by its ID. Use this when you have a specific object ID and want to retrieve its full details.
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export type FetchObjectType = "task" | "project" | "comment" | "section";
export type TaskPriority = "p1" | "p2" | "p3" | "p4";
export type UploadState = "pending" | "completed";

export interface FetchObjectInput {
  /** The type of object to fetch. */
  type: FetchObjectType;
  /** The unique ID of the object to fetch. @minLength 1 */
  id: string;
}

export interface FileAttachment {
  /** The type of resource (file, url, image, etc). */
  resourceType: string;
  /** The name of the file. */
  fileName?: string;
  /** The size of the file in bytes. */
  fileSize?: number;
  /** The MIME type of the file. */
  fileType?: string;
  /** The URL to access the file. */
  fileUrl?: string;
  /** The duration in milliseconds (for audio/video files). */
  fileDuration?: number;
  /** The upload state of the file. */
  uploadState?: UploadState;
  /** The URL for link/url resource types. */
  url?: string;
  /** The title for link/url resource types. */
  title?: string;
  /** The image URL for image resource types. */
  image?: string;
  /** The width of the image in pixels. */
  imageWidth?: number;
  /** The height of the image in pixels. */
  imageHeight?: number;
}

export interface Task {
  /** The unique ID of the task. */
  id: string;
  /** The task title/content. */
  content: string;
  /** The task description. */
  description: string;
  /** The due date of the task (ISO 8601 format). */
  dueDate?: string;
  /** Whether the task is recurring, or the recurrence string. */
  recurring: boolean | string;
  /** The deadline date of the task (ISO 8601 format). */
  deadlineDate?: string;
  /** The priority level: p1 (highest), p2 (high), p3 (medium), p4 (lowest). */
  priority: TaskPriority;
  /** The ID of the project this task belongs to. */
  projectId: string;
  /** The ID of the section this task belongs to. */
  sectionId?: string;
  /** The ID of the parent task (for subtasks). */
  parentId?: string;
  /** The labels attached to this task. */
  labels?: string[];
  /** The duration of the task (e.g., "2h30m"). */
  duration?: string;
  /** The UID of the user responsible for this task. */
  responsibleUid?: string;
  /** Whether the task is uncompletable (organizational header). */
  isUncompletable?: boolean;
  /** The UID of the user who assigned this task. */
  assignedByUid?: string;
  /** Whether the task is checked/completed. */
  checked: boolean;
  /** When the task was completed (ISO 8601 format). */
  completedAt?: string;
}

export interface Project {
  /** The unique ID of the project. */
  id: string;
  /** The name of the project. */
  name: string;
  /** The color of the project. */
  color: string;
  /** Whether the project is marked as favorite. */
  isFavorite: boolean;
  /** Whether the project is shared. */
  isShared: boolean;
  /** The ID of the parent project (for sub-projects). */
  parentId?: string;
  /** Whether this is the inbox project. */
  inboxProject: boolean;
  /** The view style of the project (list, board, calendar). */
  viewStyle: string;
}

export interface Comment {
  /** The unique ID of the comment. */
  id: string;
  /** The ID of the task this comment belongs to. */
  taskId?: string;
  /** The ID of the project this comment belongs to. */
  projectId?: string;
  /** The content of the comment. */
  content: string;
  /** When the comment was posted (ISO 8601 format). */
  postedAt: string;
  /** The UID of the user who posted this comment. */
  postedUid?: string;
  /** File attachment information, if any. */
  fileAttachment?: FileAttachment;
}

export interface Section {
  /** The unique ID of the section. */
  id: string;
  /** The name of the section. */
  name: string;
}

export interface FetchObjectOutput {
  /** The type of object fetched. */
  type: FetchObjectType;
  /** The ID of the fetched object. */
  id: string;
  /** The fetched object data. */
  object: Task | Project | Comment | Section;
}

export async function fetchObject(input: FetchObjectInput): Promise<FetchObjectOutput>;