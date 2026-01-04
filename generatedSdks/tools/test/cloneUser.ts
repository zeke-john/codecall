/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.cloneUser({ sourceId: 1, newEmail: "cloned@example.com" })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Clone User
 * @description Create a copy of an existing user with a new email address.
 * @readOnly false
 * @destructive false
 * @idempotent false
 */

export interface CloneUserInput {
  sourceId: number;
  newEmail: string;
  newName?: string;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  address: string;
  phone: string;
  favoriteColor?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CloneUserSuccessData {
  clonedUser: User;
  sourceUser: User;
}

export type CloneUserOutput = {
  success: true;
  data: CloneUserSuccessData;
};

export async function cloneUser(input: CloneUserInput): Promise<CloneUserOutput>;