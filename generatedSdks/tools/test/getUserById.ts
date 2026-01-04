/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.getUserById({ id: 1 })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Get User By ID
 * @description Get a single user by their ID. Returns the user object if found.
 * @readOnly true
 * @destructive false
 * @idempotent true
 */

export interface GetUserByIdInput {
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

export interface GetUserByIdSuccessData {
  user: User;
}

export type GetUserByIdOutput = {
  success: true;
  data: GetUserByIdSuccessData;
};

export async function getUserById(input: GetUserByIdInput): Promise<GetUserByIdOutput>;