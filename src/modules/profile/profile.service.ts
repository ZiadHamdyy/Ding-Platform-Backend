/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/modules/profile/profile.service.ts
import { Injectable, HttpStatus, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CloudinaryService } from '../../common/services/cloudinary/cloudinary.service';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';
import { PROFILE_ERROR_MESSAGES } from '../../common/constants/profile-error-messages.constant';
import { PROFILE_CONSTANTS } from '../../common/constants/profile.constants';
import { UpdateProfileRequest } from './dtos/request/update-profile.request';
import { UpdatePrivacyRequest } from './dtos/request/update-privacy.request';
import { SearchProfileRequest } from './dtos/request/search-profile.request';
import { SocialService } from '../social/social.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly socialService: SocialService,
  ) {}

  /**
   * Get user profile by userId
   * Applies privacy filtering if requester is not the owner
   */
  async getProfile(userId: string, requesterId?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        privacySettings: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!profile) {
      throw new GenericHttpException(
        PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if requester has access to view this profile
    if (requesterId && requesterId !== userId) {
      this.checkProfileAccess(profile, requesterId);
    }

    // Filter sensitive data based on privacy settings for non-owners
    if (requesterId !== userId) {
      return this.filterProfileData(profile, requesterId);
    }

    return profile;
  }

  /**
   * Create or update user profile
   * Auto-creates privacy settings with defaults if new profile
   */
  async createOrUpdateProfile(userId: string, data: UpdateProfileRequest) {
    let existingProfile;
    try {
      existingProfile = await this.prisma.profile.findUnique({
        where: { userId },
      });

      if (existingProfile) {
        // Update existing profile
        return await this.prisma.profile.update({
          where: { userId },
          data: {
            bio: data.bio,
            location: data.location,
            website: data.website,
            phoneNumber: data.phoneNumber,
            dateOfBirth: data.dateOfBirth,
          },
          include: {
            privacySettings: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });
      }

      // Create new profile with default privacy settings
      const profile = await this.prisma.profile.create({
        data: {
          userId,
          bio: data.bio,
          location: data.location,
          website: data.website,
          phoneNumber: data.phoneNumber,
          dateOfBirth: data.dateOfBirth,
          privacySettings: {
            create: {
              profileVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_PROFILE_VISIBILITY as any,
              postsVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_POSTS_VISIBILITY as any,
              friendsVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_FRIENDS_VISIBILITY as any,
              bioVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_BIO_VISIBILITY as any,
              emailVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_EMAIL_VISIBILITY as any,
              phoneVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_PHONE_VISIBILITY as any,
              locationVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_LOCATION_VISIBILITY as any,
              dateOfBirthVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_DOB_VISIBILITY as any,
              whoCanSendFriendRequests: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_FRIEND_REQUEST_PERMISSION as any,
              whoCanMessageMe: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_MESSAGE_PERMISSION as any,
            },
          },
        },
        include: {
          privacySettings: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      // Create corresponding node in Neo4j
      try {
        await this.socialService.createUserNode(
          profile.user.id,
          profile.user.name || undefined,
          profile.user.email, // Use email as username
          profile.location || undefined,
          profile.coverPhoto || undefined,
        );
      } catch (error) {
        // Log error but don't fail profile creation if Neo4j fails
        console.error('Failed to create Neo4j node for user:', error);
      }

      return profile;
    } catch (error) {
      console.error('Profile create/update error:', error);
      throw new GenericHttpException(
        existingProfile
          ? PROFILE_ERROR_MESSAGES.PROFILE_UPDATE_FAILED
          : PROFILE_ERROR_MESSAGES.PROFILE_CREATE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Upload profile picture to Cloudinary
   * Updates user.image field and ensures profile exists
   */
  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    try {
      // Upload to Cloudinary with transformations
      const imageUrl = await this.cloudinaryService.uploadProfilePicture(
        file,
        userId,
      );

      // Update user's image field
      await this.prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
      });

      // Ensure profile exists (create if needed)
      await this.ensureProfileExists(userId);

      return { imageUrl };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      console.error('Profile picture upload error:', error);
      throw new GenericHttpException(
        PROFILE_ERROR_MESSAGES.UPLOAD_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Upload cover photo to Cloudinary
   * Updates profile.coverPhoto field and ensures profile exists
   */
  async uploadCoverPhoto(userId: string, file: Express.Multer.File) {
    try {
      // Upload to Cloudinary with transformations
      const coverPhotoUrl = await this.cloudinaryService.uploadCoverPhoto(
        file,
        userId,
      );

      // Ensure profile exists (create if needed)
      const profile = await this.ensureProfileExists(userId);

      // Update profile's coverPhoto field
      await this.prisma.profile.update({
        where: { id: profile.id },
        data: { coverPhoto: coverPhotoUrl },
      });

      return { coverPhotoUrl };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      console.error('Cover photo upload error:', error);
      throw new GenericHttpException(
        PROFILE_ERROR_MESSAGES.UPLOAD_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update profile privacy settings
   * Supports partial updates - only provided fields are updated
   */
  async updatePrivacySettings(userId: string, data: UpdatePrivacyRequest) {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new GenericHttpException(
          PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // Upsert privacy settings (create if not exists, update if exists)
      return await this.prisma.profilePrivacy.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          ...data,
        },
        update: data,
      });
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      console.error('Privacy update error:', error);
      throw new GenericHttpException(
        PROFILE_ERROR_MESSAGES.PRIVACY_UPDATE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Search public profiles with filters and pagination
   * Only returns profiles with PUBLIC or EVERYONE visibility
   */
  async searchProfiles(filters: SearchProfileRequest) {
    const { query, location, page = 1, limit = 10 } = filters;

    // Build WHERE clause with privacy filter
    const where: any = {
      AND: [
        {
          privacySettings: {
            profileVisibility: {
              in: ['PUBLIC', 'EVERYONE'],
            },
          },
        },
      ],
    };

    // Add search query filter
    if (query) {
      where.AND.push({
        OR: [
          { bio: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          {
            user: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    // Add location filter
    if (location) {
      where.AND.push({
        location: { contains: location, mode: 'insensitive' },
      });
    }

    const skip = (page - 1) * limit;

    // Execute search with pagination
    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          privacySettings: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profile.count({ where }),
    ]);

    return {
      data: profiles,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Delete user profile
   * Cascades to privacy settings
   */
  async deleteProfile(userId: string) {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new GenericHttpException(
          PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // Delete profile (cascades to privacy settings via schema)
      await this.prisma.profile.delete({
        where: { id: profile.id },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      console.error('Profile delete error:', error);
      throw new GenericHttpException(
        PROFILE_ERROR_MESSAGES.PROFILE_DELETE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Ensures profile exists for user, creates with defaults if not
   * Used when uploading images before profile is created
   */
  private async ensureProfileExists(userId: string) {
    let profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.profile.create({
        data: {
          userId,
          privacySettings: {
            create: {
              profileVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_PROFILE_VISIBILITY as any,
              postsVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_POSTS_VISIBILITY as any,
              friendsVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_FRIENDS_VISIBILITY as any,
              bioVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_BIO_VISIBILITY as any,
              emailVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_EMAIL_VISIBILITY as any,
              phoneVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_PHONE_VISIBILITY as any,
              locationVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_LOCATION_VISIBILITY as any,
              dateOfBirthVisibility: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_DOB_VISIBILITY as any,
              whoCanSendFriendRequests: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_FRIEND_REQUEST_PERMISSION as any,
              whoCanMessageMe: PROFILE_CONSTANTS.PRIVACY
                .DEFAULT_MESSAGE_PERMISSION as any,
            },
          },
        },
      });
    }

    return profile;
  }

  /**
   * Check if requester has permission to view profile
   * Throws ForbiddenException if access denied
   */

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  private checkProfileAccess(profile: any, _requesterId: string) {
    const visibility = profile.privacySettings?.profileVisibility;

    // Allow access for PUBLIC/EVERYONE profiles
    if (visibility === 'PUBLIC' || visibility === 'EVERYONE') {
      return;
    }

    // Deny access for PRIVATE/ONLY_ME profiles
    if (visibility === 'PRIVATE' || visibility === 'ONLY_ME') {
      throw new ForbiddenException(PROFILE_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    }

    // Check FRIENDS visibility
    if (visibility === 'FRIENDS') {
      // TODO: Implement friend checking when friend system is ready
      throw new ForbiddenException(PROFILE_ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
    }
  }

  /**
   * Filter profile data based on privacy settings
   * Removes fields that requester doesn't have permission to view
   */
  private filterProfileData(profile: any, requesterId: string | undefined) {
    const privacy = profile.privacySettings;
    if (!privacy) return profile;

    const filtered = { ...profile };

    // Filter bio based on visibility
    if (
      !this.canViewField(privacy.bioVisibility, profile.userId, requesterId)
    ) {
      filtered.bio = null;
    }

    // Filter email based on visibility
    if (
      !this.canViewField(privacy.emailVisibility, profile.userId, requesterId)
    ) {
      filtered.user = { ...filtered.user, email: null };
    }

    // Filter phone based on visibility
    if (
      !this.canViewField(privacy.phoneVisibility, profile.userId, requesterId)
    ) {
      filtered.phoneNumber = null;
    }

    // Filter location based on visibility
    if (
      !this.canViewField(
        privacy.locationVisibility,
        profile.userId,
        requesterId,
      )
    ) {
      filtered.location = null;
    }

    // Filter date of birth based on visibility
    if (
      !this.canViewField(
        privacy.dateOfBirthVisibility,
        profile.userId,
        requesterId,
      )
    ) {
      filtered.dateOfBirth = null;
    }

    return filtered;
  }

  /**
   * Check if requester can view a specific field based on visibility setting
   */
  private canViewField(
    visibility: string,
    ownerId: string,
    requesterId: string | undefined,
  ): boolean {
    // Owner can always see their own fields
    if (!requesterId || requesterId === ownerId) return true;

    // PUBLIC/EVERYONE = visible to all
    if (visibility === 'PUBLIC' || visibility === 'EVERYONE') return true;

    // PRIVATE/ONLY_ME = only owner
    if (visibility === 'PRIVATE' || visibility === 'ONLY_ME') return false;

    // FRIENDS visibility
    if (visibility === 'FRIENDS') {
      // TODO: Check friendship when friend system is implemented
      return false;
    }

    // Default deny
    return false;
  }
}
