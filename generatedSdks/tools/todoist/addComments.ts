/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.addComments({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Add Comments
 * @description Add multiple comments to tasks or projects. Each comment must specify either taskId or projectId.
 * @readOnly false
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface CommentToAdd {
  /** The ID of the task to comment on. */
  taskId?: string;
  /** The ID of the project to comment on. Project ID should be an ID string, or the text "inbox", for inbox tasks. */
  projectId?: string;
  /** The content of the comment. @minLength 1 */
  content: string;
}

export interface AddCommentsInput {
  /** The array of comments to add. @minItems 1 */
  comments: CommentToAdd[];
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

export interface CreatedComment {
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

export interface AddCommentsOutput {
  /** The created comments. */
  comments: CreatedComment[];
  /** The total number of comments created. */
  totalCount: number;
  /** The IDs of the added comments. */
  addedCommentIds: string[];
}

export async function addComments(input: AddCommentsInput): Promise<AddCommentsOutput>;