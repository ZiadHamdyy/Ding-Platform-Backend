import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PROFILE_PERMISSION_KEY, ProfilePermission } from '../decorators/profile-permissions.decorator';
import { DatabaseService } from '../../configs/database/database.service';

@Injectable()
export class ProfilePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<ProfilePermission[]>(
      PROFILE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = request.params.userId || request.body.userId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Owner always has full permissions
    if (user.id === targetUserId) {
      return true;
    }

    // Check profile privacy settings
    const profile = await this.prisma.profile.findUnique({
      where: { userId: targetUserId },
      include: { privacySettings: true },
    });

    if (!profile) {
      return false;
    }

    // Check permissions based on privacy settings
    for (const permission of requiredPermissions) {
      if (!this.hasPermission(permission, user.id, profile)) {
        throw new ForbiddenException('Insufficient permissions to access this profile');
      }
    }

    return true;
  }

  private hasPermission(permission: ProfilePermission, userId: string, profile: any): boolean {
    const privacy = profile.privacySettings;

    switch (permission) {
      case ProfilePermission.VIEW_PROFILE:
        return this.canViewProfile(privacy.profileVisibility, userId);
      case ProfilePermission.EDIT_PROFILE:
        return userId === profile.userId;
      case ProfilePermission.DELETE_PROFILE:
        return userId === profile.userId;
      case ProfilePermission.VIEW_PRIVATE_INFO:
        return userId === profile.userId;
      default:
        return false;
    }
  }

  private canViewProfile(visibility: string, userId: string): boolean {
    switch (visibility) {
      case 'PUBLIC':
      case 'EVERYONE':
        return true;
      case 'FRIENDS':
        // TODO: Implement friend check
        return false;
      case 'PRIVATE':
      case 'ONLY_ME':
        return false;
      default:
        return false;
    }
  }
}