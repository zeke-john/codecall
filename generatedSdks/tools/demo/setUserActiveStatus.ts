/**
 * HOW TO CALL THIS TOOL:
 * await tools.demo.setUserActiveStatus({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Set User Active Status
 * @description Set a user's active or inactive status. Returns the updated user.
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

export type UserAction = "activated" | "deactivated";

export interface SetUserActiveStatusInput {
  id: number;
  isActive: boolean;
}

export interface SetUserActiveStatusSuccessData {
  user: User;
  action: UserAction;
}

export type SetUserActiveStatusOutput = {
  success: true;
  data: SetUserActiveStatusSuccessData;
};

export async function setUserActiveStatus(
  input: SetUserActiveStatusInput
): Promise<SetUserActiveStatusOutput>;
