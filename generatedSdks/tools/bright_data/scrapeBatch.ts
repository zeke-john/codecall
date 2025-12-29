/**
 * Scrape multiple webpages URLs with advanced options for content extraction and get back the results in MarkDown language. This tool can unlock any webpage even if it uses bot detection or CAPTCHA.
 */
export interface ScrapeBatchInput {
  /**
   * Array of URLs to scrape (max 10)
   */
  urls: string[];
}

export interface ScrapeBatchOutputItem {
  url?: string;
  content?: string;
}

export type ScrapeBatchOutput = ScrapeBatchOutputItem[];

export async function scrapeBatch(input: ScrapeBatchInput): Promise<ScrapeBatchOutput> {
  return call("scrape_batch", input);
}