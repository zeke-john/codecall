/**
 * HOW TO CALL THIS TOOL:
 * await tools.demo.searchUsers({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Search Users
 * @description Search users by name, email, address, or phone. Supports partial matching and pagination.
 * @readOnly true
 * @destructive false
 * @idempotent true
 * @openWorld false
 * @taskSupport forbidden
 */

export type SearchField = "name" | "email" | "address" | "phone" | "all";

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

export interface SearchUsersInput {
  query: string;
  /** @default "all" */
  field?: SearchField;
  limit?: number;
  offset?: number;
}

export interface SearchUsersSuccessData {
  users: User[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export type SearchUsersOutput = {
  success: true;
  data: SearchUsersSuccessData;
};

export async function searchUsers(
  input: SearchUsersInput
): Promise<SearchUsersOutput>;
