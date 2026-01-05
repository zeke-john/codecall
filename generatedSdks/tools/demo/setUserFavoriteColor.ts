/**
 * HOW TO CALL THIS TOOL:
 * await tools.demo.setUserFavoriteColor({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Set User Favorite Color
 * @description Set or clear a user's favorite color. Pass null to clear.
 * @readOnly false
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

export interface SetUserFavoriteColorInput {
  id: number;
  color: string | null;
}

export interface SetUserFavoriteColorSuccessData {
  user: User;
  previousColor: string | null;
  newColor: string | null;
}

export type SetUserFavoriteColorOutput = {
  success: true;
  data: SetUserFavoriteColorSuccessData;
};

export async function setUserFavoriteColor(
  input: SetUserFavoriteColorInput
): Promise<SetUserFavoriteColorOutput>;
