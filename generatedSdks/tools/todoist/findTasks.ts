/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findTasks({ searchText: "Meeting" })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title find-tasks
 * @description Find tasks by text search, or by project/section/parent container/responsible user. At least one filter must be provided.
 * @readOnly true
 * @destructive false
 * @idempotent true
 */

/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  @CC LEARNED CONSTRAINT                                                   ║
 * ║  The `findTasks` tool requires "At least one filter must be provided:    ║
 * ║  searchText, projectId, sectionId, parentId, responsibleUser, or         ║
 * ║  labels" - you cannot call it with only `responsibleUserFiltering` or    ║
 * ║  `limit`. To get all tasks, you must iterate through all projects        ║
 * ║  using `projectId` as the required filter, or provide a non-empty        ║
 * ║  `searchText`.                                                           ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

export interface FindTasksInput {
  /** The text to search for in tasks. */
  searchText?: string;
  /** Find tasks in this project or "inbox". */
  projectId?: string;
  /** Find tasks in this section. */
  sectionId?: string;
  /** Find subtasks of this parent task. */
  parentId?: string;
  /** Find tasks assigned to this user (ID, name, or email). */
  responsibleUser?: string;
  /** Filter logic for assignement: "assigned", "unassignedOrMe", "all". Default: "unassignedOrMe". */
  responsibleUserFiltering?: "assigned" | "unassignedOrMe" | "all";
  /** Max tasks to return (1-100). Default: 10. */
  limit?: number;
  /** Cursor for pagination. */
  cursor?: string;
  /** Labels to filter by. */
  labels?: string[];
  /** Operator for labels: "and" or "or". Default: "or". */
  labelsOperator?: "and" | "or";
}

export interface FindTasksOutput {
  /** The found tasks. */
  tasks: any[];
  /** Cursor for the next page of results. */
  nextCursor?: string;
  /** The total number of tasks in this page. */
  totalCount: number;
  /** Whether there are more results available. */
  hasMore: boolean;
  /** The filters that were applied to the search. */
  appliedFilters: Record<string, any>;
}

export async function findTasks(
  input: FindTasksInput
): Promise<FindTasksOutput>;
