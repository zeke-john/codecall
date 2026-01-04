/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.fetch({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Fetch
 * @description Fetch the full contents of a task or project by its ID. The ID should be in the format "task:{id}" or "project:{id}".
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface FetchInput {
  /** A unique identifier for the document in the format "task:{id}" or "project:{id}". @minLength 1 */
  id: string;
}

export interface FetchOutput {
  /** The ID of the fetched document. */
  id: string;
  /** The title of the document. */
  title: string;
  /** The text content of the document. */
  text: string;
  /** The URL of the document. */
  url: string;
  /** Additional metadata about the document. */
  metadata?: Record<string, any>;
}

export async function fetch(input: FetchInput): Promise<FetchOutput>;