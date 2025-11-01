import { Expose, Type } from 'class-transformer';

// Use the enum from the request DTO
export enum VisibilityType {
  PUBLIC = 'PUBLIC',
  FRIENDS = 'FRIENDS',
  FRIENDS_OF_FRIENDS = 'FRIENDS_OF_FRIENDS',
  ONLY_ME = 'ONLY_ME',
  PRIVATE = 'PRIVATE',
  EVERYONE = 'EVERYONE',
  CUSTOM = 'CUSTOM',
}

class UserBasicInfo {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  image: string;
}

class ProfilePrivacyResponse {
  @Expose()
  id: string;

  @Expose()
  profileVisibility: VisibilityType;

  @Expose()
  postsVisibility: VisibilityType;

  @Expose()
  friendsVisibility: VisibilityType;

  @Expose()
  bioVisibility: VisibilityType;

  @Expose()
  emailVisibility: VisibilityType;

  @Expose()
  phoneVisibility: VisibilityType;

  @Expose()
  locationVisibility: VisibilityType;

  @Expose()
  dateOfBirthVisibility: VisibilityType;

  @Expose()
  whoCanSendFriendRequests: VisibilityType;

  @Expose()
  whoCanMessageMe: VisibilityType;

  @Expose()
  allowCameraAccess: boolean;

  @Expose()
  allowMicrophoneAccess: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class ProfileResponse {
  @Expose()
  id: string;

  @Expose()
  userId: string;

  @Expose()
  bio: string;

  @Expose()
  coverPhoto: string;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  location: string;

  @Expose()
  website: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  @Type(() => UserBasicInfo)
  user: UserBasicInfo;

  @Expose()
  @Type(() => ProfilePrivacyResponse)
  privacySettings: ProfilePrivacyResponse;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
