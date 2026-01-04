/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.updateComments({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Update Comments
 * @description Update multiple existing comments with new content.
 * @readOnly false
 * @destructive true
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface CommentToUpdate {
  /** The ID of the comment to update. @minLength 1 */
  id: string;
  /** The new content for the comment. @minLength 1 */
  content: string;
}

export interface UpdateCommentsInput {
  /** The comments to update. @minItems 1 */
  comments: CommentToUpdate[];
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

export interface UpdatedComment {
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

export interface CommentAppliedOperations {
  /** The number of comments updated. */
  updateCount: number;
}

export interface UpdateCommentsOutput {
  /** The updated comments. */
  comments: UpdatedComment[];
  /** The total number of comments updated. */
  totalCount: number;
  /** The IDs of the updated comments. */
  updatedCommentIds: string[];
  /** Summary of operations performed. */
  appliedOperations: CommentAppliedOperations;
}

export async function updateComments(input: UpdateCommentsInput): Promise<UpdateCommentsOutput>;