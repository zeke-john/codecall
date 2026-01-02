/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.search({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface SearchInput {
  query: string;
}

export interface SearchResult {
  id?: string;
  title?: string;
  url?: string;
}

export interface SearchOutput {
  results?: SearchResult[];
}

/**
 * INPUT EXAMPLE:
 * {
 *   "query": "test"
 * }
 *
 * OUTPUT EXAMPLE:
 * {
 *   "results": [
 *     {
 *       "id": "task:6fG7fW8mjWxxVGRv",
 *       "title": "test one two three",
 *       "url": "https://app.todoist.com/app/task/6fG7fW8mjWxxVGRv"
 *     },
 *     {
 *       "id": "task:6fGWFQFpm6m9jf2M",
 *       "title": "Tweet about Donald Trump (trending now)",
 *       "url": "https://app.todoist.com/app/task/6fGWFQFpm6m9jf2M"
 *     },
 *     // ... more items
 *   ]
 * }
 */
export async function search(input: SearchInput): Promise<SearchOutput>;