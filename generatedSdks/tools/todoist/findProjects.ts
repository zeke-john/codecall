/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findProjects({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Find Projects
 * @description List all projects or search for projects by name. When searching, all matching projects are returned (pagination is ignored). When not searching, projects are returned with pagination.
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface FindProjectsInput {
  /** Search for a project by name (partial and case insensitive match). If omitted, all projects are returned. */
  search?: string;
  /** The maximum number of projects to return. @default 50 @minimum 1 @maximum 200 */
  limit?: number;
  /** The cursor to get the next page of projects (cursor is obtained from the previous call to this tool, with the same parameters). */
  cursor?: string;
}

export interface FoundProject {
  /** The unique ID of the project. */
  id: string;
  /** The name of the project. */
  name: string;
  /** The color of the project. */
  color: string;
  /** Whether the project is marked as favorite. */
  isFavorite: boolean;
  /** Whether the project is shared. */
  isShared: boolean;
  /** The ID of the parent project (for sub-projects). */
  parentId?: string;
  /** Whether this is the inbox project. */
  inboxProject: boolean;
  /** The view style of the project (list, board, calendar). */
  viewStyle: string;
}

export interface FindProjectsOutput {
  /** The found projects. */
  projects: FoundProject[];
  /** Cursor for the next page of results. */
  nextCursor?: string;
  /** The total number of projects in this page. */
  totalCount: number;
  /** Whether there are more results available. */
  hasMore: boolean;
  /** The filters that were applied to the search. */
  appliedFilters: Record<string, any>;
}

export async function findProjects(input: FindProjectsInput): Promise<FindProjectsOutput>;