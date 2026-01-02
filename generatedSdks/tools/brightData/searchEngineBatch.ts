/**
 * HOW TO CALL THIS TOOL:
 * await tools.brightData.searchEngineBatch({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface BatchQuery {
  query: string;
  engine?: "google" | "bing" | "yandex";
  cursor?: string;
}

export interface SearchEngineBatchInput {
  queries: BatchQuery[];
}

export interface SearchResult {
  organic?: {
    link?: string;
    source?: string;
    display_link?: string;
    title?: string;
    description?: string;
    extensions?: {
      type?: string;
      text?: string;
      link?: string;
      rank?: number;
    }[];
    rank?: number;
    global_rank?: number;
  }[];
  images?: any[];
  current_page?: number;
  related?: {
    text?: string;
    link?: string;
    rank?: number;
    global_rank?: number;
  }[];
  ai_overview?: null;
}

export type SearchEngineBatchOutput = {
  query?: string;
  engine?: string;
  result?: SearchResult;
}[];

/**
 * INPUT EXAMPLE:
 * {
 *   "queries": [
 *     {
 *       "query": "current stock market status"
 *     },
 *     {
 *       "query": "weather forecast"
 *     }
 *   ]
 * }
 *
 * OUTPUT EXAMPLE:
 * [
 *   {
 *     "query": "current stock market status",
 *     "engine": "google",
 *     "result": {
 *       "organic": [
 *         {
 *           "link": "https://www.cnn.com/markets",
 *           "source": "CNN",
 *           "title": "US Markets, World Markets, and Stock Quotes",
 *           "rank": 1
 *         }
 *       ]
 *     }
 *   }
 * ]
 */
export async function searchEngineBatch(
  input: SearchEngineBatchInput
): Promise<SearchEngineBatchOutput>;
