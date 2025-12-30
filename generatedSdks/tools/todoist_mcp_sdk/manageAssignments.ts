export interface ManageAssignmentsInput {
  /** The assignment operation to perform. */
  operation: "assign" | "unassign" | "reassign";
  /** The IDs of the tasks to operate on (max 50). */
  taskIds: string[];
  /** The user to assign tasks to. Can be user ID, name, or email. Required for assign and reassign operations. */
  responsibleUser?: string;
  /** For reassign operations: the current assignee to reassign from. Can be user ID, name, or email. Optional - if not provided, reassigns from any current assignee. */
  fromAssigneeUser?: string;
  /** If true, validates operations without executing them. */
  dryRun?: boolean;
}

/**
 * Bulk assignment operations for multiple tasks. Supports assign, unassign, and reassign operations with atomic rollback on failures.
 */
export async function manageAssignments(input: ManageAssignmentsInput): Promise<void> {
  return call("manage-assignments", input);
}