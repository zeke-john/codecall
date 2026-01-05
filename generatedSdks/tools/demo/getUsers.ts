/**
 * HOW TO CALL THIS TOOL:
 * await tools.demo.getUsers({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Get Users
 * @description Get all users from the database. Returns an array of user objects with count.
 * @readOnly true
 * @destructive false
 * @idempotent true
 * @openWorld false
 * @taskSupport forbidden
 */

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

export interface GetUsersInput {}

export interface GetUsersSuccessData {
  users: User[];
  count: number;
}

export type GetUsersOutput = {
  success: true;
  data: GetUsersSuccessData;
};

export async function getUsers(input?: GetUsersInput): Promise<GetUsersOutput>;
