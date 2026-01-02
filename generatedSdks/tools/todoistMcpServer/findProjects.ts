/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.findProjects({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface FindProjectsInput {
  search?: string;
  limit?: number;
  cursor?: string;
}

/**
 * INPUT EXAMPLE:
 * {
 *   "limit": 10
 * }
 *
 * OUTPUT EXAMPLE:
 * "Projects: 5 (limit 10).\nPreview:\n    Inbox • Inbox • id=6GrP7ffcmf2cxqwv\n    School • ⭐ • id=6Jc95fcq5VQH4GwH\n    SumanyAI • ⭐ • id=6Jc95jV4PMV34R5g\n    General • ⭐ • id=6Jc982PJP4G65CXX\n    codecall_test_project_1715600000 • id=6fgP32WMQjH7Fcqq"
 */
export async function findProjects(input: FindProjectsInput): Promise<string>;