/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.findProjectCollaborators({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface FindProjectCollaboratorsInput {
  projectId: string;
  searchTerm?: string;
}

export async function findProjectCollaborators(input: FindProjectCollaboratorsInput): Promise<any>;