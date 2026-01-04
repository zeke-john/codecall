/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.fetchObject({ type: "task", id: "123" })
 *
 * @title fetch-object
 * @description Fetch single entity by ID.
 * @readOnly true
 */

export interface FetchObjectInput {
  type: "task" | "project" | "comment" | "section";
  id: string;
}

export interface FetchObjectOutput {
  type: "task" | "project" | "comment" | "section";
  id: string;
  object: any;
}

export async function fetchObject(input: FetchObjectInput): Promise<FetchObjectOutput>;