/**
 * HOW TO CALL THIS TOOL:
 * await tools.demo.getActiveUsers({})
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Get Active Users
 * @description Get all active users from the database.
 * @readOnly true
 * @destructive false
 * @idempotent true
 */

export interface GetActiveUsersInput {}

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

export interface GetActiveUsersSuccessData {
  users: User[];
  count: number;
  totalUsers: number;
}

export type GetActiveUsersOutput = {
  success: true;
  data: GetActiveUsersSuccessData;
};

export async function getActiveUsers(
  input: GetActiveUsersInput
): Promise<GetActiveUsersOutput>;
