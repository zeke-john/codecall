/**
 * Run multiple search queries simultaneously. Returns JSON for Google, Markdown for Bing/Yandex.
 */
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

export async function searchEngineBatch(input: SearchEngineBatchInput): Promise<SearchEngineBatchOutput> {
  return call("search_engine_batch", input);
}