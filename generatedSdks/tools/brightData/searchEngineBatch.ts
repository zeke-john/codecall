export interface SearchEngineBatchInput {
  queries: {
    query: string;
    engine?: "google" | "bing" | "yandex";
    cursor?: string;
  }[];
}

export interface SearchEngineBatchOutputItem {
  query?: string;
  engine?: string;
  result?: {
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
  };
}

export type SearchEngineBatchOutput = SearchEngineBatchOutputItem[];

/**
 * INPUT EXAMPLE:
 * {
 *   "queries": [
 *     {
 *       "query": "current stock market"
 *     },
 *     {
 *       "query": "global weather updates"
 *     }
 *   ]
 * }
 *
 * OUTPUT EXAMPLE:
 * [
 *   {
 *     "query": "current stock market",
 *     "engine": "google",
 *     "result": {
 *       "organic": [
 *         {
 *           "link": "https://www.cnn.com/markets",
 *           "source": "CNN",
 *           "display_link": "https://www.cnn.com › markets",
 *           "title": "US Markets, World Markets, and Stock Quotes",
 *           "description": "World markets ; Dow. United States. 48,063.29 ; S&P 500. United States. 6,845.50 ; NASDAQ. United States. 23,241.99 ; VIX. United States. 14.95 ; Russell 2000.",
 *           "rank": 1,
 *           "global_rank": 1
 *         }
 *       ]
 *     }
 *   }
 * ]
 */

/**
 * Run multiple search queries simultaneously. Returns JSON for Google, Markdown for Bing/Yandex.
 */
export async function searchEngineBatch(
  input: SearchEngineBatchInput
): Promise<SearchEngineBatchOutput> {
  return call("search_engine_batch", input);
}
