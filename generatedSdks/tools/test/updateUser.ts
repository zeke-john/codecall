/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.updateUser({ id: 1, name: "Updated Name" })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Update User
 * @description Update an existing user in the database by ID. Returns the updated user object.
 * @readOnly false
 * @destructive false
 * @idempotent false
 */

export interface UpdateUserInput {
  id: number;
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
  favoriteColor?: string;
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

export interface UpdateUserSuccessData {
  user: User;
  action: "updated";
}

export type UpdateUserOutput = {
  success: true;
  data: UpdateUserSuccessData;
};

export async function updateUser(input: UpdateUserInput): Promise<UpdateUserOutput>;