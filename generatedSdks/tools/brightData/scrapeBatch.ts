/**
 * HOW TO CALL THIS TOOL:
 * await tools.brightData.scrapeBatch({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface ScrapeBatchInput {
  /** Array of URLs to scrape (max 10) */
  urls: string[];
}

export type ScrapeBatchOutput = {
  url?: string;
  content?: string;
}[];

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
 *     "content": "Example Domain\n\n# Example Domain..."
 *   },
 *   {
 *     "url": "https://www.iana.org",
 *     "content": "Internet Assigned Numbers Authority..."
 *   }
 * ]
 */
export async function scrapeBatch(input: ScrapeBatchInput): Promise<ScrapeBatchOutput>;