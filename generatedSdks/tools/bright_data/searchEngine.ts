/**
 * Scrape search results from Google, Bing or Yandex. Returns SERP results in JSON or Markdown (URL, title, description), Ideal forgathering current information, news, and detailed search results.
 */
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

export async function searchEngine(input: SearchEngineInput): Promise<SearchEngineOutput> {
  return call("search_engine", input);
}