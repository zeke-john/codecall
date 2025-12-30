export interface GetOverviewInput {
  /** Optional project ID. If provided, shows detailed overview of that project. If omitted, shows overview of all projects. */
  projectId?: string;
}

/**
 * Get a Markdown overview. If no projectId is provided, shows all projects with hierarchy and sections (useful for navigation). If projectId is provided, shows detailed overview of that specific project including all tasks grouped by sections.
 */
export async function getOverview(input: GetOverviewInput): Promise<string> {
  return call("get-overview", input);
}