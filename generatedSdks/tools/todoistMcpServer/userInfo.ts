/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.userInfo({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface UserInfoInput {}

/**
 * INPUT EXAMPLE:
 * {}
 *
 * OUTPUT EXAMPLE:
 * "# User Information\n\n**User ID:** 36927342\n**Full Name:** Zeke\n**Email:** zekejohn118@gmail.com\n**Timezone:** UTC\n**Current Local Time:** 01/02/2026, 13:17:43\n\n## Week Settings\n**Week Start Day:** Sunday (7)
// ... more items"
 */
export async function userInfo(input: UserInfoInput): Promise<string>;