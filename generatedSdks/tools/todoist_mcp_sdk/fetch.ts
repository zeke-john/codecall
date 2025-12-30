export interface FetchInput {
  /** A unique identifier for the document in the format "task:{id}" or "project:{id}". */
  id: string;
}

/**
 * Fetch the full contents of a task or project by its ID. The ID should be in the format "task:{id}" or "project:{id}".
 */
export async function fetch(input: FetchInput): Promise<any> {
  return call("fetch", input);
}