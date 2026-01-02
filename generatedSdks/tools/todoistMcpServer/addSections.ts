/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.addSections({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface SectionInput {
  name: string;
  projectId: string;
}

export interface AddSectionsInput {
  sections: SectionInput[];
}

export async function addSections(input: AddSectionsInput): Promise<string>;