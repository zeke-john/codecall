/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.updateSections({ sections: [{ id: "1", name: "New Name" }] })
 *
 * @title update-sections
 * @description Update multiple existing sections.
 * @readOnly false
 * @destructive true
 */

export interface UpdateSectionItem {
  id: string;
  name: string;
}

export interface UpdateSectionsInput {
  sections: UpdateSectionItem[];
}

export interface UpdateSectionsOutput {
  sections: { id: string; name: string }[];
  totalCount: number;
  updatedSectionIds: string[];
}

export async function updateSections(input: UpdateSectionsInput): Promise<UpdateSectionsOutput>;