/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.getOverview({ projectId: "123" })
 *
 * @title get-overview
 * @description Get a Markdown overview of account or project.
 * @readOnly true
 */

export interface GetOverviewInput {
  projectId?: string;
}

export interface GetOverviewOutput {
  type: "account_overview" | "project_overview";
  totalProjects?: number;
  totalTasks?: number;
  totalSections?: number;
  tasksWithoutSection?: number;
  projectInfo?: any;
  hasNestedProjects?: boolean;
  inbox?: any;
  projects?: any[];
  project?: any;
  sections?: any[];
  tasks?: any[];
  stats?: any;
}

export async function getOverview(input: GetOverviewInput): Promise<GetOverviewOutput>;