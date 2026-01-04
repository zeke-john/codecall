/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.manageAssignments({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Manage Assignments
 * @description Bulk assignment operations for multiple tasks. Supports assign, unassign, and reassign operations with atomic rollback on failures.
 * @readOnly false
 * @destructive true
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export type AssignmentOperation = "assign" | "unassign" | "reassign";

export interface ManageAssignmentsInput {
  /** The assignment operation to perform. */
  operation: AssignmentOperation;
  /** The IDs of the tasks to operate on (max 50). @minItems 1 @maxItems 50 */
  taskIds: string[];
  /** The user to assign tasks to. Can be user ID, name, or email. Required for assign and reassign operations. */
  responsibleUser?: string;
  /** For reassign operations: the current assignee to reassign from. Can be user ID, name, or email. Optional - if not provided, reassigns from any current assignee. */
  fromAssigneeUser?: string;
  /** If true, validates operations without executing them. @default false */
  dryRun?: boolean;
}

export interface AssignmentResult {
  /** The ID of the task. */
  taskId: string;
  /** Whether the operation was successful. */
  success: boolean;
  /** Error message if the operation failed. */
  error?: string;
  /** The original assignee ID before the operation. */
  originalAssigneeId?: string;
  /** The new assignee ID after the operation. */
  newAssigneeId?: string;
}

export interface AssignmentSummary {
  /** Total number of tasks processed. */
  total: number;
  /** Number of successful operations. */
  succeeded: number;
  /** Number of failed operations. */
  failed: number;
  /** Whether this was a dry run. */
  dryRun: boolean;
}

export interface ManageAssignmentsOutput {
  /** Results of the assignment operations. */
  results: AssignmentResult[];
  /** Summary of the operation. */
  summary?: AssignmentSummary;
}

export async function manageAssignments(input: ManageAssignmentsInput): Promise<ManageAssignmentsOutput>;