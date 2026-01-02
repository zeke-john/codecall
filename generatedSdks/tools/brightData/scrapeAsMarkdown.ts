/**
 * HOW TO CALL THIS TOOL:
 * await tools.brightData.scrapeAsMarkdown({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

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
 * " Wikipedia               \n\n![](portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png)\n\n# Wikipedia **The Free Encyclopedia**\n\n[**English** 7,102,000+ articles](//en.wikipedia.org/ \"English — Wikipedia\") ..."
 */
export async function scrapeAsMarkdown(input: ScrapeAsMarkdownInput): Promise<string>;