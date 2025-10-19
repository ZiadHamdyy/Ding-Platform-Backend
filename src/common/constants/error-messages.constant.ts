/**
 * Centralized Error Messages
 * All error message keys and their corresponding values
 */
export const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  LOGOUT_FAILED: 'Failed to logout. Please try again',

  // User Errors
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_BLOCKED: 'Your account has been blocked. Please contact support',
  CANNOT_DEACTIVATE_OWN_ACCOUNT: 'You cannot deactivate your own account',
  EMAIL_CHECK_FAILED: 'Failed to verify email. Please try again',

  // Session Errors
  SESSION_CREATE_FAILED: 'Failed to create session. Please try again',
  SESSION_DELETE_FAILED: 'Failed to delete session. Please try again',
  SESSION_RETRIEVE_FAILED: 'Failed to retrieve sessions. Please try again',
  SESSION_COUNT_FAILED: 'Failed to count sessions. Please try again',
  SESSION_NOT_FOUND: 'Session not found or you do not have permission to access it',
  SESSION_TERMINATE_FAILED: 'Failed to terminate session. Please try again',
  SESSION_TERMINATE_ALL_FAILED: 'Failed to terminate all sessions. Please try again',
} as const;

// Type for error message keys
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

