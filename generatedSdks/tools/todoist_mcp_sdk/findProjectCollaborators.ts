export interface FindProjectCollaboratorsInput {
  /** The ID of the project to search for collaborators in. */
  projectId: string;
  /** Search for a collaborator by name or email (partial and case insensitive match). If omitted, all collaborators in the project are returned. */
  searchTerm?: string;
}

/**
 * Search for collaborators by name or other criteria in a project.
 */
export async function findProjectCollaborators(input: FindProjectCollaboratorsInput): Promise<any> {
  return call("find-project-collaborators", input);
}