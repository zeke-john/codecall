/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.manageAssignments({ operation: "assign", taskIds: ["1"], responsibleUser: "me@email.com" })
 *
 * @title manage-assignments
 * @description Bulk assignment operations.
 * @readOnly false
 * @destructive true
 */

export interface ManageAssignmentsInput {
  operation: "assign" | "unassign" | "reassign";
  taskIds: string[];
  responsibleUser?: string;
  fromAssigneeUser?: string;
  dryRun?: boolean;
}

export interface ManageAssignmentsOutput {
  results: { taskId: string; success: boolean; error?: string; originalAssigneeId?: string; newAssigneeId?: string }[];
  summary: { total: number; succeeded: number; failed: number; dryRun: boolean };
}

export async function manageAssignments(input: ManageAssignmentsInput): Promise<ManageAssignmentsOutput>;