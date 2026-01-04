/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.bulkCreateUsers({ users: [{ name: "User 1", email: "u1@ex.com", address: "Addr 1", phone: "123" }] })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Bulk Create Users
 * @description Create multiple users at once. Returns the list of created users.
 * @readOnly false
 * @destructive false
 * @idempotent false
 */

export interface CreateUserData {
  name: string;
  email: string;
  address: string;
  phone: string;
  favoriteColor?: string;
}

export interface BulkCreateUsersInput {
  users: CreateUserData[];
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

export interface SkippedUser {
  email: string;
  reason: string;
}

export interface BulkCreateUsersSuccessData {
  created: User[];
  createdCount: number;
  skipped: SkippedUser[];
  skippedCount: number;
}

export type BulkCreateUsersOutput = {
  success: true;
  data: BulkCreateUsersSuccessData;
};

export async function bulkCreateUsers(input: BulkCreateUsersInput): Promise<BulkCreateUsersOutput>;