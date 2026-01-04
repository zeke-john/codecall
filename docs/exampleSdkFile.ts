/**
 * HOW TO CALL THIS TOOL:
 * await tools.userManagement.cloneUser({ sourceId: 1, newEmail: "new@email.com" })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Clone User
 * @description Create a copy of an existing user with a new email address.
 * @readOnly false
 * @destructive false
 * @idempotent false
 *
 * INPUT EXAMPLE (all parameters):
 * {
 *   "sourceId": 5,
 *   "newEmail": "cloned.user@example.com",
 *   "newName": "Cloned User Name"
 * }
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

export interface CloneUserInput {
  /** The ID of the user to clone */
  sourceId: number;
  /** The email address for the new cloned user */
  newEmail: string;
  /** Optional new name for the cloned user (defaults to source user's name) */
  newName?: string;
}

export interface CloneUserSuccessData {
  /** The newly created cloned user */
  clonedUser: User;
  /** The original user that was cloned */
  sourceUser: User;
}

export interface CloneUserError {
  /** Error code identifying the type of error */
  code: string;
  /** Human-readable error message */
  message: string;
}

export type CloneUserOutput =
  | { success: true; data: CloneUserSuccessData }
  | { success: false; error: CloneUserError };

/**
 * Create a copy of an existing user with a new email address.
 *
 * SUCCESS RESPONSE EXAMPLE:
 * {
 *   "success": true,
 *   "data": {
 *     "clonedUser": {
 *       "id": 21,
 *       "name": "John Doe",
 *       "email": "new@email.com",
 *       "address": "123 Main St",
 *       "phone": "555-1234",
 *       "favoriteColor": "blue",
 *       "isActive": true,
 *       "createdAt": "2026-01-03T12:00:00.000Z"
 *     },
 *     "sourceUser": {
 *       "id": 1,
 *       "name": "John Doe",
 *       "email": "john@example.com",
 *       "address": "123 Main St",
 *       "phone": "555-1234",
 *       "favoriteColor": "blue",
 *       "isActive": true,
 *       "createdAt": "2025-03-15T00:00:00.000Z"
 *     }
 *   }
 * }
 *
 * ERROR RESPONSE EXAMPLES:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "USER_NOT_FOUND",
 *     "message": "Source user with id 999 not found"
 *   }
 * }
 *
 * {
 *   "success": false,
 *   "error": {
 *     "code": "EMAIL_EXISTS",
 *     "message": "Email new@email.com is already in use"
 *   }
 * }
 */
export async function cloneUser(
  input: CloneUserInput
): Promise<CloneUserOutput>;
