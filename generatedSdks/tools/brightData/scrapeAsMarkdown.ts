export interface ScrapeAsMarkdownInput {
  url: string;
}

/**
 * INPUT EXAMPLE:
 * {
 *   "url": "https://www.wikipedia.org"
 * }
 *
 * OUTPUT EXAMPLE:
 * " Wikipedia               \n\n![](portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png)\n\n# Wikipedia **The Free Encyclopedia**\n\n[**English** 7,102,000+ articles](//en.wikipedia.org/ \"English — Wikipedia — The Free Encyclopedia\")\n..."
 */

/**
 * Scrape a single webpage URL with advanced options for content extraction and get back the results in MarkDown language. This tool can unlock any webpage even if it uses bot detection or CAPTCHA.
 */
export async function scrapeAsMarkdown(input: ScrapeAsMarkdownInput): Promise<string> {
  return call("scrape_as_markdown", input);
}