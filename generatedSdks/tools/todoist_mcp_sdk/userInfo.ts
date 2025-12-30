export interface UserInfoInput {}

/**
 * Get comprehensive user information including user ID, full name, email, timezone with current local time, week start day preferences, current week dates, daily/weekly goal progress, and user plan (Free/Pro/Business).
 */
export async function userInfo(input: UserInfoInput): Promise<string> {
  return call("user-info", input);
}