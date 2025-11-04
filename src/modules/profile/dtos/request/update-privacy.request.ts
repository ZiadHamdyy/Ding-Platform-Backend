import { IsOptional, IsEnum, IsBoolean } from 'class-validator';

// Define the enum locally since Prisma doesn't export it
export enum VisibilityType {
  PUBLIC = 'PUBLIC',
  FRIENDS = 'FRIENDS',
  FRIENDS_OF_FRIENDS = 'FRIENDS_OF_FRIENDS',
  ONLY_ME = 'ONLY_ME',
  PRIVATE = 'PRIVATE',
  EVERYONE = 'EVERYONE',
  CUSTOM = 'CUSTOM',
}

export class UpdatePrivacyRequest {
  @IsOptional()
  @IsEnum(VisibilityType, {
    message: 'Profile visibility must be a valid visibility type',
  })
  profileVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType, {
    message: 'Posts visibility must be a valid visibility type',
  })
  postsVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType, {
    message: 'Friends visibility must be a valid visibility type',
  })
  friendsVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType, {
    message: 'Bio visibility must be a valid visibility type',
  })
  bioVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType, {
    message: 'Email visibility must be a valid visibility type',
  })
  emailVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType, {
    message: 'Phone visibility must be a valid visibility type',
  })
  phoneVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType, {
    message: 'Location visibility must be a valid visibility type',
  })
  locationVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType, {
    message: 'Date of birth visibility must be a valid visibility type',
  })
  dateOfBirthVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType, {
    message: 'Friend request permission must be a valid visibility type',
  })
  whoCanSendFriendRequests?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType, {
    message: 'Message permission must be a valid visibility type',
  })
  whoCanMessageMe?: VisibilityType;

  @IsOptional()
  @IsBoolean()
  allowCameraAccess?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMicrophoneAccess?: boolean;
}
