/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findProjectCollaborators({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Find Project Collaborators
 * @description Search for collaborators by name or other criteria in a project.
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface FindProjectCollaboratorsInput {
  /** The ID of the project to search for collaborators in. @minLength 1 */
  projectId: string;
  /** Search for a collaborator by name or email (partial and case insensitive match). If omitted, all collaborators in the project are returned. */
  searchTerm?: string;
}

export interface Collaborator {
  /** The unique ID of the user. */
  id: string;
  /** The full name of the user. */
  name: string;
  /** The email address of the user. */
  email: string;
}

export interface CollaboratorProjectInfo {
  /** The project ID. */
  id: string;
  /** The project name. */
  name: string;
  /** Whether the project is shared. */
  isShared: boolean;
}

export interface FindProjectCollaboratorsOutput {
  /** The found collaborators. */
  collaborators: Collaborator[];
  /** Information about the project. */
  projectInfo?: CollaboratorProjectInfo;
  /** The total number of collaborators found. */
  totalCount: number;
  /** The total number of available collaborators in the project. */
  totalAvailable?: number;
  /** The filters that were applied to the search. */
  appliedFilters: Record<string, any>;
}

export async function findProjectCollaborators(input: FindProjectCollaboratorsInput): Promise<FindProjectCollaboratorsOutput>;