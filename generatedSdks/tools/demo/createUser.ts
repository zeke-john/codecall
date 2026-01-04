/**
 * HOW TO CALL THIS TOOL:
 * await tools.demo.createUser({ name: "John Doe", email: "john@example.com", address: "123 Main St", phone: "555-0199" })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Create User
 * @description Create a new user in the database. Returns the created user object with its assigned ID. Users are active by default.
 * @readOnly false
 * @destructive false
 * @idempotent false
 */

export interface CreateUserInput {
  name: string;
  email: string;
  address: string;
  phone: string;
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

export interface CreateUserSuccessData {
  user: User;
  action: "created";
}

export type CreateUserOutput = {
  success: true;
  data: CreateUserSuccessData;
};

export async function createUser(
  input: CreateUserInput
): Promise<CreateUserOutput>;
