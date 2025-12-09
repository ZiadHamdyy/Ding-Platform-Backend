import { Expose, Type } from 'class-transformer';

export class MessageResponse {
  @Expose()
  message: string;
}

class UserBasicInfo {
  @Expose()
  name: string | null;

  @Expose()
  image: string | null;
}

export class FriendResponse {
  @Expose()
  userId: string;

  @Expose()
  bio: string | null;

  // Indicates if the current user follows this person back (followers list)
  @Expose()
  isFollowedBack?: boolean;

  @Expose()
  @Type(() => UserBasicInfo)
  user: UserBasicInfo;
}

class FriendsListMeta {
  @Expose()
  limit: number;

  @Expose()
  offset: number;

  @Expose()
  total: number;

  @Expose()
  hasMore: boolean;

  @Expose()
  nextOffset: number | null;
}

export class FriendsListResponse {
  @Expose()
  @Type(() => FriendResponse)
  data: FriendResponse[];

  @Expose()
  @Type(() => FriendsListMeta)
  meta: FriendsListMeta;
}

export class RecommendedUserResponse {
  @Expose()
  userId: string;

  @Expose()
  bio: string | null;

  @Expose()
  @Type(() => UserBasicInfo)
  user: UserBasicInfo;

  @Expose()
  score: number;

  @Expose()
  mutualFriends: number;

  @Expose()
  reason: string;
}

class RecommendationsListMeta {
  @Expose()
  limit: number;

  @Expose()
  offset: number;

  @Expose()
  total: number;

  @Expose()
  hasMore: boolean;

  @Expose()
  nextOffset: number | null;
}

export class RecommendationsListResponse {
  @Expose()
  @Type(() => RecommendedUserResponse)
  data: RecommendedUserResponse[];

  @Expose()
  @Type(() => RecommendationsListMeta)
  meta: RecommendationsListMeta;
}

