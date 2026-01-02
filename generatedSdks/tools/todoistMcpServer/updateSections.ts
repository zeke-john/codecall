/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.updateSections({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface SectionUpdateInput {
  id: string;
  name: string;
}

export interface UpdateSectionsInput {
  sections: SectionUpdateInput[];
}

export async function updateSections(input: UpdateSectionsInput): Promise<string>;