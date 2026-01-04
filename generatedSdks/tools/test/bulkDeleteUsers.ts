/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.bulkDeleteUsers({ ids: [1, 2, 3] })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Bulk Delete Users
 * @description Delete multiple users at once by their IDs. Returns the list of deleted users and any failures.
 * @readOnly false
 * @destructive true
 * @idempotent true
 */

export interface BulkDeleteUsersInput {
  ids: number[];
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

export interface BulkDeleteUsersSuccessData {
  deleted: User[];
  deletedCount: number;
  notFound: number[];
  notFoundCount: number;
}

export type BulkDeleteUsersOutput = {
  success: true;
  data: BulkDeleteUsersSuccessData;
};

export async function bulkDeleteUsers(input: BulkDeleteUsersInput): Promise<BulkDeleteUsersOutput>;