/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.getOverview({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Get Overview
 * @description Get a Markdown overview. If no projectId is provided, shows all projects with hierarchy and sections (useful for navigation). If projectId is provided, shows detailed overview of that specific project including all tasks grouped by sections.
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface GetOverviewInput {
  /** Optional project ID. If provided, shows detailed overview of that project. If omitted, shows overview of all projects. @minLength 1 */
  projectId?: string;
}

export type OverviewType = "account_overview" | "project_overview";

export interface ProjectInfo {
  id: string;
  name: string;
  isShared: boolean;
  isFavorite: boolean;
}

export interface GetOverviewOutput {
  /** The type of overview returned. */
  type: OverviewType;
  /** Total number of projects (account overview only). */
  totalProjects?: number;
  /** Total number of tasks. */
  totalTasks?: number;
  /** Total number of sections (project overview only). */
  totalSections?: number;
  /** Number of tasks not in any section (project overview only). */
  tasksWithoutSection?: number;
  /** Project information (project overview only). */
  projectInfo?: ProjectInfo;
  /** Whether account has nested projects (account overview only). */
  hasNestedProjects?: boolean;
  /** Inbox information (account overview only). */
  inbox?: any;
  /** List of projects (account overview only). */
  projects?: any[];
  /** Project details (project overview only). */
  project?: any;
  /** List of sections (project overview only). */
  sections?: any[];
  /** List of tasks (project overview only). */
  tasks?: any[];
  /** Statistics object (project overview only). */
  stats?: any;
}

export async function getOverview(input: GetOverviewInput): Promise<GetOverviewOutput>;