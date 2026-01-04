/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.search({ query: "Buy milk" })
 *
 * @title search
 * @description Search across tasks and projects.
 * @readOnly true
 */

export interface SearchInput {
  query: string;
}

export interface SearchOutput {
  results: { id: string; title: string; url: string }[];
  totalCount: number;
}

export async function search(input: SearchInput): Promise<SearchOutput>;