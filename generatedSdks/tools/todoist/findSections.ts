/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findSections({ projectId: "123", search: "Sprint" })
 *
 * @title find-sections
 * @description Search for sections in a project.
 * @readOnly true
 */

export interface FindSectionsInput {
  projectId: string;
  search?: string;
}

export interface FindSectionsOutput {
  sections: { id: string; name: string }[];
  totalCount: number;
  appliedFilters: Record<string, any>;
}

export async function findSections(input: FindSectionsInput): Promise<FindSectionsOutput>;