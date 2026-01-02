/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.findSections({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface FindSectionsInput {
  projectId: string;
  search?: string;
}

/**
 * INPUT EXAMPLE:
 * {
 *   "projectId": "inbox"
 * }
 *
 * OUTPUT EXAMPLE:
 * "Sections in project inbox: 1.\nPreview:\n    codecall_test_section_1715600000 • id=6fgP32h86xJWMMQv"
 */
export async function findSections(input: FindSectionsInput): Promise<string>;