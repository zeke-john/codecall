/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.getUserStats({})
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Get User Stats
 * @description Get statistics about users in the database including active/inactive counts and popular colors.
 * @readOnly true
 * @destructive false
 * @idempotent true
 */

export interface GetUserStatsInput {}

export interface EmailDomainStat {
  domain: string;
  count: number;
}

export interface FavoriteColorStat {
  color: string;
  count: number;
}

export interface GetUserStatsSuccessData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersWithFavoriteColor: number;
  topEmailDomains: EmailDomainStat[];
  topFavoriteColors: FavoriteColorStat[];
}

export type GetUserStatsOutput = {
  success: true;
  data: GetUserStatsSuccessData;
};

export async function getUserStats(input: GetUserStatsInput): Promise<GetUserStatsOutput>;