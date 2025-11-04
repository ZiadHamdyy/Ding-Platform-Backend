export const PROFILE_ERROR_MESSAGES = {
  // Profile Errors
  PROFILE_NOT_FOUND: 'Profile not found',
  PROFILE_CREATE_FAILED: 'Failed to create profile',
  PROFILE_UPDATE_FAILED: 'Failed to update profile',
  PROFILE_DELETE_FAILED: 'Failed to delete profile',
  
  // Privacy Errors
  PRIVACY_UPDATE_FAILED: 'Failed to update privacy settings',
  UNAUTHORIZED_ACCESS: 'You do not have permission to access this profile',
  
  // Upload Errors
  UPLOAD_FAILED: 'Failed to upload image',
  INVALID_FILE_TYPE: 'Invalid file type. Only JPG, PNG, and WEBP are allowed',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  
  // Validation Errors
  INVALID_DATE_OF_BIRTH: 'Date of birth must be a valid date',
  INVALID_PHONE_NUMBER: 'Phone number must be valid',
  INVALID_WEBSITE_URL: 'Website must be a valid URL',
  BIO_TOO_LONG: 'Bio must not exceed 500 characters',
  LOCATION_TOO_LONG: 'Location must not exceed 100 characters',
} as const;