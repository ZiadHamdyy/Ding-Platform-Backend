/**
 * Centralized Error Messages
 * All error message keys and their corresponding values
 */
export const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  LOGOUT_FAILED: 'Failed to logout. Please try again',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
  SESSION_EXPIRED: 'Your session has expired. Please login again',
  TOKEN_REFRESH_FAILED: 'Failed to refresh token. Please try again',

  // Password Recovery Errors
  OTP_SENT_IF_EMAIL_EXISTS: 'OTP sent if email exists',
  OTP_SENT_SUCCESS: 'OTP sent successfully to your email',
  INVALID_OR_EXPIRED_OTP: 'Invalid or expired OTP',
  OTP_VERIFIED_SUCCESS: 'OTP verified successfully',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  OTP_SEND_FAILED: 'Failed to send OTP. Please try again',
  PASSWORD_RESET_FAILED: 'Failed to reset password. Please try again',
  OTP_NOT_VERIFIED: 'Please verify OTP before resetting password',

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
  SESSION_NOT_FOUND:
    'Session not found or you do not have permission to access it',
  SESSION_TERMINATE_FAILED: 'Failed to terminate session. Please try again',
  SESSION_TERMINATE_ALL_FAILED:
    'Failed to terminate all sessions. Please try again',

  // Validation Messages (DTOs)
  EMAIL_REQUIRED: 'Email is required',
  INVALID_EMAIL: 'Email address is invalid',
  EMAIL_SHOULD_BE_STRING: 'Email must be a string',

  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_SHOULD_BE_STRING: 'Password must be a string',
  PASSWORD_MIN_LENGTH_8_MAX_25: 'Password must be between 8 and 25 characters',
  PASSWORD_MIN_LENGTH_8: 'Password must be at least 8 characters',

  NAME_REQUIRED: 'Name is required',
  NAME_SHOULD_BE_STRING: 'Name must be a string',
  NAME_MAX_LENGTH_25: 'Name must be at most 25 characters',
  NAME_MIN_LENGTH_3: 'Name must be at least 3 characters',
  NAME_MAX_LENGTH_100: 'Name must be at most 100 characters',

  IMAGE_SHOULD_BE_STRING: 'Image must be a string',
  IMAGE_MAX_LENGTH_255: 'Image must be at most 255 characters',
  IMAGE_MAX_LENGTH_500: 'Image must be at most 500 characters',

  USERNAME_REQUIRED: 'Username is required',
  USERNAME_MIN_LENGTH_6: 'Username must be at least 6 characters',
  USERNAME_SHOULD_BE_STRING: 'Username must be a string',

  USER_ID_REQUIRED: 'User ID is required',
  USER_ID_SHOULD_BE_STRING: 'User ID must be a string',
  USER_ID_SHOULD_BE_STRING_FILTER: 'User ID must be a string',

  ACTIVE_STATUS_SHOULD_BE_BOOLEAN: 'Active status must be a boolean',
  ACTIVE_STATUS_REQUIRED: 'Active status is required',

  // OTP Validation Messages
  OTP_REQUIRED: 'OTP is required',
  OTP_SHOULD_BE_STRING: 'OTP must be a string',
  OTP_MUST_BE_6_DIGITS: 'OTP must be exactly 6 digits',

  // Password Update Messages
  OLD_PASSWORD_REQUIRED: 'Old password is required',
  OLD_PASSWORD_SHOULD_BE_STRING: 'Old password must be a string',
  OLD_PASSWORD_INCORRECT: 'Old password is incorrect',
  PASSWORD_UPDATE_SUCCESS: 'Password updated successfully',
  PASSWORD_UPDATE_FAILED: 'Failed to update password. Please try again',
  NEW_PASSWORD_SAME_AS_OLD: 'New password must be different from old password',

  // Email Verification Messages
  EMAIL_VERIFICATION_SUCCESS: 'Email verified successfully',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified',
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',
  SIGNUP_SUCCESS:
    'Signup successful. Please check your email to verify your account.',

  // Session Messages
  ALREADY_SIGNED_IN: 'You are already signed in with this device',

  // Resend Verification Messages
  VERIFICATION_CODE_RESENT: 'Verification code has been resent to your email',
  FORGOT_PASSWORD_CODE_RESENT:
    'Password reset code has been resent to your email',

  // Social Errors
  CANNOT_SEND_FRIEND_REQUEST_TO_SELF:
    'You cannot send a friend request to yourself',
  USER_NOT_FOUND_IN_SOCIAL: 'User not found',
  ALREADY_FRIENDS: 'You are already friends with this user',
  FRIEND_REQUEST_ALREADY_SENT: 'Friend request has already been sent',
  FRIEND_REQUEST_NOT_FOUND: 'Friend request not found',
  ALREADY_HAVE_FRIEND_REQUEST:
    'You already have a pending friend request from this user',
  NOT_FRIENDS: 'You are not friends with this user',
  FRIEND_REQUEST_FAILED: 'Failed to send friend request. Please try again',
  ACCEPT_FRIEND_REQUEST_FAILED:
    'Failed to accept friend request. Please try again',

  REJECT_FRIEND_REQUEST_FAILED:
    'Failed to reject friend request. Please try again',
  REMOVE_FRIEND_FAILED: 'Failed to remove friend. Please try again',
  GET_FRIENDS_FAILED: 'Failed to retrieve friends. Please try again',
  GET_FRIEND_REQUESTS_FAILED:
    'Failed to retrieve friend requests. Please try again',

  CANNOT_FOLLOW_SELF: 'You cannot follow yourself',
  FOLLOW_FAILED: 'Failed to follow user. Please try again',
  UNFOLLOW_FAILED: 'Failed to unfollow user. Please try again',
  GET_FOLLOWERS_FAILED: 'Failed to retrieve followers. Please try again',
  GET_FOLLOWING_FAILED: 'Failed to retrieve following list. Please try again',

  // Post Errors
  POSTS_NOT_FOUND: 'No posts found',
  POST_CREATION_FAILED: 'Failed to create post. Please try again',
  POST_NOT_FOUND: 'Post not found',
  POST_UPDATE_FAILED: 'Failed to update post. Please try again',
  POST_DELETE_FAILED: 'Failed to delete post. Please try again',
  POST_UNAUTHORIZED: 'You do not have permission to modify this post',
  POST_CONTENT_TOO_LONG:
    'Post content exceeds maximum length of 10,000 characters',
  POST_TOO_MANY_IMAGES: 'You can upload a maximum of 5 images per post',
  POST_TOO_MANY_VIDEOS: 'You can upload a maximum of 2 videos per post',
  POST_INVALID_IMAGE_TYPE:
    'Invalid image type. Allowed types: JPEG, PNG, GIF, WebP',
  POST_INVALID_VIDEO_TYPE:
    'Invalid video type. Allowed types: MP4, WebM, QuickTime',
  POST_IMAGE_TOO_LARGE: 'Image size exceeds maximum of 5MB',
  POST_VIDEO_TOO_LARGE: 'Video size exceeds maximum of 50MB',
  POST_MEDIA_UPLOAD_FAILED: 'Failed to upload media. Please try again',
  POST_ALREADY_DELETED: 'This post has already been deleted',
  POST_RESTORE_FAILED: 'Failed to restore post. Please try again',

  // Comment Errors
  COMMENT_NOT_FOUND: 'Comment not found',
  COMMENT_CREATION_FAILED: 'Failed to create comment. Please try again',
  COMMENT_DELETE_FAILED: 'Failed to delete comment. Please try again',
  COMMENT_UNAUTHORIZED: 'You do not have permission to delete this comment',
  COMMENT_NESTING_NOT_ALLOWED: 'Cannot reply to nested comments',
  CANNOT_REPLY_TO_SELF: 'You cannot reply to your own comment', // Optional rule

  // Like Errors
  LIKE_NOT_FOUND: 'Like not found',
  POST_ALREADY_LIKED: 'Post is already liked',
  COMMENT_LIKES_NOT_SUPPORTED:
    'Comment likes are not supported in the current schema',
} as const;

// Type for error message keys
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
