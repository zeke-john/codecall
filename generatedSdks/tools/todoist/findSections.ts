/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.findSections({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Find Sections
 * @description Search for sections by name or other criteria in a project. When searching, all sections in the project are fetched to ensure complete results.
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface FindSectionsInput {
  /** The ID of the project to search sections in. Project ID should be an ID string, or the text "inbox", for inbox tasks. @minLength 1 */
  projectId: string;
  /** Search for a section by name (partial and case insensitive match). If omitted, all sections in the project are returned. */
  search?: string;
}

export interface FoundSection {
  /** The unique ID of the section. */
  id: string;
  /** The name of the section. */
  name: string;
}

export interface FindSectionsOutput {
  /** The found sections. */
  sections: FoundSection[];
  /** The total number of sections found. */
  totalCount: number;
  /** The filters that were applied to the search. */
  appliedFilters: Record<string, any>;
}

export async function findSections(input: FindSectionsInput): Promise<FindSectionsOutput>;