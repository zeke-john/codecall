/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoist.userInfo({})
 *
 * @title user-info
 * @description Get comprehensive user profile and preferences.
 * @readOnly true
 */

export interface UserInfoInput {}

export interface UserInfoOutput {
  type: "user_info";
  userId: string;
  fullName: string;
  timezone: string;
  currentLocalTime: string;
  startDay: number;
  startDayName: string;
  weekStartDate: string;
  weekEndDate: string;
  currentWeekNumber: number;
  completedToday: number;
  dailyGoal: number;
  weeklyGoal: number;
  email: string;
  plan: "Todoist Free" | "Todoist Pro" | "Todoist Business";
}

export async function userInfo(input: UserInfoInput): Promise<UserInfoOutput>;