/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.checkEmailExists({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Check Email Exists
 * @description Check if an email address is already registered in the database.
 * @readOnly true
 * @destructive false
 * @idempotent true
 * @openWorld false
 * @taskSupport forbidden
 */

export interface CheckEmailExistsInput {
  email: string;
}

export interface CheckEmailExistsSuccessData {
  exists: boolean;
  userId: number | null;
}

export type CheckEmailExistsOutput = {
  success: true;
  data: CheckEmailExistsSuccessData;
};

export async function checkEmailExists(input: CheckEmailExistsInput): Promise<CheckEmailExistsOutput>;