import { IsOptional, IsEnum } from 'class-validator';

enum VisibilityType {
  PUBLIC = 'PUBLIC',
  FRIENDS = 'FRIENDS',
  FRIENDS_OF_FRIENDS = 'FRIENDS_OF_FRIENDS',
  ONLY_ME = 'ONLY_ME',
  PRIVATE = 'PRIVATE',
  EVERYONE = 'EVERYONE',
  CUSTOM = 'CUSTOM',
}

export class UpdatePrivacyDto {
  @IsOptional()
  @IsEnum(VisibilityType)
  profileVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType)
  postsVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType)
  friendsVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType)
  bioVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType)
  emailVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType)
  phoneVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType)
  locationVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType)
  dateOfBirthVisibility?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType)
  whoCanSendFriendRequests?: VisibilityType;

  @IsOptional()
  @IsEnum(VisibilityType)
  whoCanMessageMe?: VisibilityType;
}
