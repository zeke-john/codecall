/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.getUserStats({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Get User Stats
 * @description Get statistics about users in the database including active/inactive counts and popular colors.
 * @readOnly true
 * @destructive false
 * @idempotent true
 * @openWorld false
 * @taskSupport forbidden
 */

export interface EmailDomain {
  domain: string;
  count: number;
}

export interface FavoriteColor {
  color: string;
  count: number;
}

export interface GetUserStatsInput {}

export interface GetUserStatsSuccessData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersWithFavoriteColor: number;
  topEmailDomains: EmailDomain[];
  topFavoriteColors: FavoriteColor[];
}

export type GetUserStatsOutput = {
  success: true;
  data: GetUserStatsSuccessData;
};

export async function getUserStats(input?: GetUserStatsInput): Promise<GetUserStatsOutput>;