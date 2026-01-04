/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.validateEmailFormat({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Validate Email Format
 * @description Check if an email address has a valid format (does not check if it exists).
 * @readOnly true
 * @destructive false
 * @idempotent true
 * @openWorld false
 * @taskSupport forbidden
 */

export interface ValidateEmailFormatInput {
  email: string;
}

export interface ValidateEmailFormatSuccessData {
  email: string;
  isValid: boolean;
  domain: string | null;
}

export type ValidateEmailFormatOutput = {
  success: true;
  data: ValidateEmailFormatSuccessData;
};

export async function validateEmailFormat(input: ValidateEmailFormatInput): Promise<ValidateEmailFormatOutput>;