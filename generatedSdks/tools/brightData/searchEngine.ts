export interface SearchEngineInput {
  query: string;
  engine?: "google" | "bing" | "yandex";
  /**
   * Pagination cursor for next page
   */
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
 *       "description": "World · Around 40 dead in Swiss ski resort bar fire, police say · Deadly clashes between protesters and security forces as Iran unrest grows · Stranger Things ...Read more",
 *       "extensions": [
 *         {
 *           "inline": true,
 *           "type": "text",
 *           "text": "22 hours ago",
 *           "rank": 1
 *         },
 *         {
 *           "type": "site_link",
 *           "text": "BBC World",
 *           "link": "https://www.bbc.com/news/world_radio_and_tv",
 *           "rank": 2
 *         }
 *         // ... more items
 *       ],
 *       "rank": 1,
 *       "global_rank": 7
 *     }
 *   ],
 *   "images": [],
 *   "current_page": 1,
 *   "related": [
 *     {
 *       "text": "Breaking news today",
 *       "link": "https://www.google.com/search?sca_esv=18e49b020ebfc0ba&hl=en&q=Breaking+news+today&sa=X&ved=2ahUKEwioqcWm7OuRAxXqkokEHWclIcsQ1QJ6BAgyEAE",
 *       "rank": 1,
 *       "global_rank": 16
 *     }
 *   ],
 *   "ai_overview": null
 * }
 */

/**
 * Scrape search results from Google, Bing or Yandex. Returns SERP results in JSON or Markdown (URL, title, description), Ideal forgathering current information, news, and detailed search results.
 */
export async function searchEngine(input: SearchEngineInput): Promise<SearchEngineOutput> {
  return call("search_engine", input);
}