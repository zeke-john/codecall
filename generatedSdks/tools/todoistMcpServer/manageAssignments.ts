/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.manageAssignments({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface ManageAssignmentsInput {
  operation: "assign" | "unassign" | "reassign";
  /** Max 50 IDs. */
  taskIds: string[];
  responsibleUser?: string;
  fromAssigneeUser?: string;
  dryRun?: boolean;
}

export async function manageAssignments(input: ManageAssignmentsInput): Promise<void>;