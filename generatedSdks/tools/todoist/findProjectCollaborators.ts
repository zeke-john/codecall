/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findProjectCollaborators({ projectId: "123" })
 *
 * @title find-project-collaborators
 * @description Search for collaborators in a project.
 * @readOnly true
 */

export interface FindProjectCollaboratorsInput {
  projectId: string;
  searchTerm?: string;
}

export interface FindProjectCollaboratorsOutput {
  collaborators: { id: string; name: string; email: string }[];
  projectInfo: { id: string; name: string; isShared: boolean };
  totalCount: number;
  totalAvailable?: number;
  appliedFilters: Record<string, any>;
}

export async function findProjectCollaborators(input: FindProjectCollaboratorsInput): Promise<FindProjectCollaboratorsOutput>;