export interface FindSectionsInput {
  /** The ID of the project to search sections in. Project ID should be an ID string, or the text "inbox", for inbox tasks. */
  projectId: string;
  /** Search for a section by name (partial and case insensitive match). If omitted, all sections in the project are returned. */
  search?: string;
}

/**
 * Search for sections by name or other criteria in a project. When searching, all sections in the project are fetched to ensure complete results.
 */
export async function findSections(input: FindSectionsInput): Promise<string> {
  return call("find-sections", input);
}