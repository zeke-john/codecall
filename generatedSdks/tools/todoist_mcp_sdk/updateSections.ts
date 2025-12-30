export interface UpdateSectionsInput {
  /** The sections to update. */
  sections: {
    /** The ID of the section to update. */
    id: string;
    /** The new name of the section. */
    name: string;
  }[];
}

/**
 * Update multiple existing sections with new values.
 */
export async function updateSections(input: UpdateSectionsInput): Promise<void> {
  return call("update-sections", input);
}