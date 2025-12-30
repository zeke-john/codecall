export interface AddSectionsInput {
  /** The array of sections to add. */
  sections: {
    /** The name of the section. */
    name: string;
    /** The ID of the project to add the section to. Project ID should be an ID string, or the text "inbox", for inbox tasks. */
    projectId: string;
  }[];
}

/**
 * Add one or more new sections to projects.
 */
export async function addSections(input: AddSectionsInput): Promise<void> {
  return call("add-sections", input);
}