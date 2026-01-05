/**
 * HOW TO CALL THIS TOOL:
 * await tools.demo.getUsersCreatedAfter({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Get Users Created After
 * @description Get all users created after a specific date.
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

export interface GetUsersCreatedAfterInput {
  date: string;
  includeInactive?: boolean;
}

export interface GetUsersCreatedAfterSuccessData {
  users: User[];
  count: number;
  afterDate: string;
}

export type GetUsersCreatedAfterOutput = {
  success: true;
  data: GetUsersCreatedAfterSuccessData;
};

export async function getUsersCreatedAfter(
  input: GetUsersCreatedAfterInput
): Promise<GetUsersCreatedAfterOutput>;
