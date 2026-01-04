/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.deleteUser({ id: 1 })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Delete User
 * @description Delete a user from the database by ID. Returns the deleted user object.
 * @readOnly false
 * @destructive true
 * @idempotent true
 */

export interface DeleteUserInput {
  id: number;
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

export interface DeleteUserSuccessData {
  user: User;
  action: "deleted";
}

export type DeleteUserOutput = {
  success: true;
  data: DeleteUserSuccessData;
};

export async function deleteUser(input: DeleteUserInput): Promise<DeleteUserOutput>;