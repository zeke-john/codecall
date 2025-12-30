export interface SearchInput {
  /** The search query string to find tasks and projects. */
  query: string;
}

export interface SearchOutput {
  results?: {
    id?: string;
    title?: string;
    url?: string;
  }[];
}

/**
 * Search across tasks and projects in Todoist. Returns a list of relevant results with IDs, titles, and URLs.
 */
export async function search(input: SearchInput): Promise<SearchOutput> {
  return call("search", input);
}