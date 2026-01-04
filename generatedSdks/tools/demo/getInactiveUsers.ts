/**
 * HOW TO CALL THIS TOOL:
 * await tools.demo.getInactiveUsers({})
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Get Inactive Users
 * @description Get all inactive users from the database.
 * @readOnly true
 * @destructive false
 * @idempotent true
 */

export interface GetInactiveUsersInput {}

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

export interface GetInactiveUsersSuccessData {
  users: User[];
  count: number;
  totalUsers: number;
}

export type GetInactiveUsersOutput = {
  success: true;
  data: GetInactiveUsersSuccessData;
};

export async function getInactiveUsers(
  input: GetInactiveUsersInput
): Promise<GetInactiveUsersOutput>;
