export interface FindProjectsInput {
  /** Search for a project by name (partial and case insensitive match). If omitted, all projects are returned. */
  search?: string;
  /** The maximum number of projects to return. */
  limit?: number;
  /** The cursor to get the next page of projects (cursor is obtained from the previous call to this tool, with the same parameters). */
  cursor?: string;
}

/**
 * List all projects or search for projects by name. When searching, all matching projects are returned (pagination is ignored). When not searching, projects are returned with pagination.
 */
export async function findProjects(input: FindProjectsInput): Promise<string> {
  return call("find-projects", input);
}