import { Expose } from 'class-transformer';

export class PrivacyResponseDto {
  @Expose()
  id: string;

  @Expose()
  profileId: string;

  @Expose()
  profileVisibility: string;

  @Expose()
  postsVisibility: string;

  @Expose()
  friendsVisibility: string;

  @Expose()
  bioVisibility: string;

  @Expose()
  emailVisibility: string;

  @Expose()
  phoneVisibility: string;

  @Expose()
  locationVisibility: string;

  @Expose()
  dateOfBirthVisibility: string;

  @Expose()
  whoCanSendFriendRequests: string;

  @Expose()
  whoCanMessageMe: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
