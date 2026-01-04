/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.userInfo({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title User Info
 * @description Get comprehensive user information including user ID, full name, email, timezone with current local time, week start day preferences, current week dates, daily/weekly goal progress, and user plan (Free/Pro/Business).
 * @readOnly true
 * @destructive false
 * @idempotent false
 * @openWorld false
 * @taskSupport forbidden
 */

export interface UserInfoInput {}

export type UserPlan = "Todoist Free" | "Todoist Pro" | "Todoist Business";

export interface UserInfoOutput {
  /** The type of the response. */
  type: "user_info";
  /** The user ID. */
  userId: string;
  /** The full name of the user. */
  fullName: string;
  /** The timezone of the user. */
  timezone: string;
  /** The current local time of the user. */
  currentLocalTime: string;
  /** The start day of the week (1 = Monday, 7 = Sunday). */
  startDay: number;
  /** The name of the start day. */
  startDayName: string;
  /** The start date of the current week (YYYY-MM-DD). */
  weekStartDate: string;
  /** The end date of the current week (YYYY-MM-DD). */
  weekEndDate: string;
  /** The current week number of the year. */
  currentWeekNumber: number;
  /** The number of tasks completed today. */
  completedToday: number;
  /** The daily goal for task completions. */
  dailyGoal: number;
  /** The weekly goal for task completions. */
  weeklyGoal: number;
  /** The email address of the user. */
  email: string;
  /** The user plan. */
  plan: UserPlan;
}

export async function userInfo(input: UserInfoInput): Promise<UserInfoOutput>;