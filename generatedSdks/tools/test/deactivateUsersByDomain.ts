/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.deactivateUsersByDomain({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Deactivate Users By Domain
 * @description Deactivate all users with emails from a specific domain.
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

export interface DeactivateUsersByDomainInput {
  domain: string;
}

export interface DeactivateUsersByDomainSuccessData {
  domain: string;
  deactivated: User[];
  deactivatedCount: number;
  alreadyInactiveCount: number;
}

export type DeactivateUsersByDomainOutput = {
  success: true;
  data: DeactivateUsersByDomainSuccessData;
};

export async function deactivateUsersByDomain(input: DeactivateUsersByDomainInput): Promise<DeactivateUsersByDomainOutput>;