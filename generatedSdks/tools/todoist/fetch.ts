/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.fetch({ id: "task:123" })
 *
 * @title fetch
 * @description Fetch full contents of a task or project by ID string.
 * @readOnly true
 */

export interface FetchInput {
  /** ID in format "task:{id}" or "project:{id}". */
  id: string;
}

export interface FetchOutput {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata?: Record<string, any>;
}

export async function fetch(input: FetchInput): Promise<FetchOutput>;