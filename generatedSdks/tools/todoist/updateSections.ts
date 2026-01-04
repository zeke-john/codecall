/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.updateSections({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Update Sections
 * @description Update multiple existing sections with new values.
 * @readOnly false
 * @destructive true
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface SectionToUpdate {
  /** The ID of the section to update. @minLength 1 */
  id: string;
  /** The new name of the section. @minLength 1 */
  name: string;
}

export interface UpdateSectionsInput {
  /** The sections to update. @minItems 1 */
  sections: SectionToUpdate[];
}

export interface UpdatedSection {
  /** The unique ID of the section. */
  id: string;
  /** The name of the section. */
  name: string;
}

export interface UpdateSectionsOutput {
  /** The updated sections. */
  sections: UpdatedSection[];
  /** The total number of sections updated. */
  totalCount: number;
  /** The IDs of the updated sections. */
  updatedSectionIds: string[];
}

export async function updateSections(input: UpdateSectionsInput): Promise<UpdateSectionsOutput>;