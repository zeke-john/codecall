/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.addSections({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Add Sections
 * @description Add one or more new sections to projects.
 * @readOnly false
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface SectionToAdd {
  /** The name of the section. @minLength 1 */
  name: string;
  /** The ID of the project to add the section to. Project ID should be an ID string, or the text "inbox", for inbox tasks. @minLength 1 */
  projectId: string;
}

export interface AddSectionsInput {
  /** The array of sections to add. @minItems 1 */
  sections: SectionToAdd[];
}

export interface CreatedSection {
  /** The unique ID of the section. */
  id: string;
  /** The name of the section. */
  name: string;
}

export interface AddSectionsOutput {
  /** The created sections. */
  sections: CreatedSection[];
  /** The total number of sections created. */
  totalCount: number;
}

export async function addSections(input: AddSectionsInput): Promise<AddSectionsOutput>;