/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.getUsersByFavoriteColor({ color: "blue" })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Get Users By Favorite Color
 * @description Find all users with a specific favorite color.
 * @readOnly true
 * @destructive false
 * @idempotent true
 */

export interface GetUsersByFavoriteColorInput {
  color: string;
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

export interface GetUsersByFavoriteColorSuccessData {
  users: User[];
  count: number;
  color: string;
}

export type GetUsersByFavoriteColorOutput = {
  success: true;
  data: GetUsersByFavoriteColorSuccessData;
};

export async function getUsersByFavoriteColor(input: GetUsersByFavoriteColorInput): Promise<GetUsersByFavoriteColorOutput>;