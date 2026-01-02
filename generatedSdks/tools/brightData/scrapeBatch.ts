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

/**
 * INPUT EXAMPLE:
 * {
 *   "urls": [
 *     "https://example.com",
 *     "https://www.iana.org"
 *   ]
 * }
 *
 * OUTPUT EXAMPLE:
 * [
 *   {
 *     "url": "https://example.com",
 *     "content": "Example Domain\n\n# Example Domain\n\nThis domain is for use in documentation examples..."
 *   },
 *   {
 *     "url": "https://www.iana.org",
 *     "content": "Internet Assigned Numbers Authority       \n\n# Internet Assigned Numbers Authority..."
 *   }
 * ]
 */

/**
 * Scrape multiple webpages URLs with advanced options for content extraction and get back the results in MarkDown language. This tool can unlock any webpage even if it uses bot detection or CAPTCHA.
 */
export async function scrapeBatch(
  input: ScrapeBatchInput
): Promise<ScrapeBatchOutput> {
  return call("scrape_batch", input);
}
