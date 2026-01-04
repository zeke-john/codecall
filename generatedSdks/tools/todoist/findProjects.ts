/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findProjects({ search: "Work" })
 *
 * @title find-projects
 * @description List or search projects.
 * @readOnly true
 * @destructive false
 */

export interface FindProjectsInput {
  /** Case-insensitive partial name match. */
  search?: string;
  /** Limit (1-200). Default: 50. */
  limit?: number;
  /** Pagination cursor. */
  cursor?: string;
}

export interface FindProjectsOutput {
  projects: any[];
  nextCursor?: string;
  totalCount: number;
  hasMore: boolean;
  appliedFilters: Record<string, any>;
}

export async function findProjects(input: FindProjectsInput): Promise<FindProjectsOutput>;