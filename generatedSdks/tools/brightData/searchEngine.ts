/**
 * HOW TO CALL THIS TOOL:
 * await tools.brightData.searchEngine({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface SearchEngineInput {
  query: string;
  engine?: "google" | "bing" | "yandex";
  cursor?: string;
}

export interface SearchEngineOutput {
  organic?: {
    link?: string;
    source?: string;
    display_link?: string;
    title?: string;
    description?: string;
    extensions?: {
      inline?: boolean;
      type?: string;
      text?: string;
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

/**
 * INPUT EXAMPLE:
 * {
 *   "query": "latest world news"
 * }
 *
 * OUTPUT EXAMPLE:
 * {
 *   "organic": [
 *     {
 *       "link": "https://www.bbc.com/news/world",
 *       "source": "BBC",
 *       "display_link": "https://www.bbc.com › news › world",
 *       "title": "World | Latest News & Updates",
 *       "description": "World · Around 40 dead in Swiss ski resort bar fire, police say · Deadly clashes between protesters and security forces as Iran unrest grows · Stranger Things ...",
 *       "extensions": [
 *         {
 *           "inline": true,
 *           "type": "text",
 *           "text": "23 hours ago",
 *           "rank": 1
 *         }
 *       ],
 *       "rank": 1,
 *       "global_rank": 6
 *     }
 *     // ... more items
 *   ],
 *   "images": [],
 *   "current_page": 1,
 *   "related": [
 *     {
 *       "text": "World News today live",
 *       "link": "https://www.google.com/search?q=...",
 *       "rank": 1,
 *       "global_rank": 15
 *     }
 *   ]
 * }
 */
export async function searchEngine(input: SearchEngineInput): Promise<SearchEngineOutput>;