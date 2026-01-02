/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.getOverview({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface GetOverviewInput {
  projectId?: string;
}

/**
 * INPUT EXAMPLE:
 * {}
 *
 * OUTPUT EXAMPLE:
 * "# Personal Projects\n\n- Inbox Project: Inbox (id=6GrP7ffcmf2cxqwv)\n  - Section: codecall_test_section_1715600000 (id=6fgP32h86xJWMMQv)\n- Project: School (id=6Jc95fcq5VQH4GwH)\n- Project: SumanyAI (id=6Jc95jV4PMV34R5g)\n- Project: General (id=6Jc982PJP4G65CXX)\n- Project: codecall_test_project_1715600000 (id=6fgP32WMQjH7Fcqq)\n"
 */
export async function getOverview(input: GetOverviewInput): Promise<string>;