/**
 * Scrape a single webpage URL with advanced options for content extraction and get back the results in MarkDown language. This tool can unlock any webpage even if it uses bot detection or CAPTCHA.
 */
export interface ScrapeAsMarkdownInput {
  url: string;
}

export type ScrapeAsMarkdownOutput = string;

export async function scrapeAsMarkdown(input: ScrapeAsMarkdownInput): Promise<ScrapeAsMarkdownOutput> {
  return call("scrape_as_markdown", input);
}