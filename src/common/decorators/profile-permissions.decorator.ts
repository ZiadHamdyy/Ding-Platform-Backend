import { SetMetadata } from '@nestjs/common';

export const PROFILE_PERMISSION_KEY = 'profilePermission';

export enum ProfilePermission {
  VIEW_PROFILE = 'view_profile',
  EDIT_PROFILE = 'edit_profile',
  DELETE_PROFILE = 'delete_profile',
  VIEW_PRIVATE_INFO = 'view_private_info',
}

export const RequireProfilePermission = (...permissions: ProfilePermission[]) =>
  SetMetadata(PROFILE_PERMISSION_KEY, permissions);