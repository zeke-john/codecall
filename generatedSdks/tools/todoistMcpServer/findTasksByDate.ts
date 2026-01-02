/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.findTasksByDate({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface FindTasksByDateInput {
  /** Format: YYYY-MM-DD or 'today'. */
  startDate?: string;
  overdueOption?: "overdue-only" | "include-overdue" | "exclude-overdue";
  daysCount?: number;
  limit?: number;
  cursor?: string;
  responsibleUser?: string;
  responsibleUserFiltering?: "assigned" | "unassignedOrMe" | "all";
  labels?: string[];
  labelsOperator?: "and" | "or";
}

/**
 * INPUT EXAMPLE:
 * {
 *   "startDate": "today",
 *   "overdueOption": "include-overdue",
 *   "limit": 10
 * }
 *
 * OUTPUT EXAMPLE:
 * "Today's tasks + overdue: 9 (limit 10).\nFilter: today + overdue tasks.\nPreview:\n    Delete user Alan Turing (ID 26) from THE DATABASE COMPANY database • due 2025-11-17 • P2 • id=6fG7jMrpRxfqFMWv\n    Watch: Philadelphia Eagles vs. Detroit Lions — Next Eagles game (Nov 16, 2025) • due 2025-11-16 • P2 • id=6fG986v5G75xJXHM\n    // ... more items"
 */
export async function findTasksByDate(input: FindTasksByDateInput): Promise<string>;