/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.addSections({ sections: [{ name: "To Do", projectId: "123" }] })
 *
 * @title add-sections
 * @description Add one or more new sections to projects.
 * @readOnly false
 */

export interface SectionInput {
  name: string;
  projectId: string;
}

export interface AddSectionsInput {
  sections: SectionInput[];
}

export interface AddSectionsOutput {
  sections: { id: string; name: string }[];
  totalCount: number;
}

export async function addSections(input: AddSectionsInput): Promise<AddSectionsOutput>;