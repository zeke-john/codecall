/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findComments({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Find Comments
 * @description Find comments by task, project, or get a specific comment by ID. Exactly one of taskId, projectId, or commentId must be provided.
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface FindCommentsInput {
  /** Find comments for a specific task. */
  taskId?: string;
  /** Find comments for a specific project. Project ID should be an ID string, or the text "inbox", for inbox tasks. */
  projectId?: string;
  /** Get a specific comment by ID. */
  commentId?: string;
  /** Pagination cursor for retrieving more results. */
  cursor?: string;
  /** Maximum number of comments to return @minimum 1 @maximum 10 */
  limit?: number;
}

export type UploadState = "pending" | "completed";

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

export interface FoundComment {
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

export interface FindCommentsOutput {
  /** The found comments. */
  comments: FoundComment[];
  /** The type of search performed: "single" (comment ID), "task" (task ID), or "project" (project ID). */
  searchType: string;
  /** The ID that was searched for (comment, task, or project ID). */
  searchId: string;
  /** Whether there are more results available. */
  hasMore: boolean;
  /** Cursor for the next page of results. */
  nextCursor?: string;
  /** The total number of comments in this page. */
  totalCount: number;
}

export async function findComments(input: FindCommentsInput): Promise<FindCommentsOutput>;