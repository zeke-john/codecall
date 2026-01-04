/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.search({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Search
 * @description Search across tasks and projects in Todoist. Returns a list of relevant results with IDs, titles, and URLs.
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface SearchInput {
  /** The search query string to find tasks and projects. @minLength 1 */
  query: string;
}

export interface SearchResult {
  /** The ID of the result. */
  id: string;
  /** The title of the result. */
  title: string;
  /** The URL of the result. */
  url: string;
}

export interface SearchOutput {
  /** The search results. */
  results: SearchResult[];
  /** Total number of results found. */
  totalCount: number;
}

export async function search(input: SearchInput): Promise<SearchOutput>;