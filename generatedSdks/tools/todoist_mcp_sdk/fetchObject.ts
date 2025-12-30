export interface FetchObjectInput {
  /** The type of object to fetch. */
  type: "task" | "project" | "comment" | "section";
  /** The unique ID of the object to fetch. */
  id: string;
}

/**
 * Fetch a single task, project, comment, or section by its ID. Use this when you have a specific object ID and want to retrieve its full details.
 */
export async function fetchObject(input: FetchObjectInput): Promise<any> {
  return call("fetch-object", input);
}