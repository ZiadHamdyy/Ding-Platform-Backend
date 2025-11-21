import { Expose, Type } from 'class-transformer';
import { UserNode, RecommendedUser } from '../../../../common/interfaces/user.interface';

export class MessageResponse {
  @Expose()
  message: string;
}

export class FriendResponse implements UserNode {
  @Expose()
  userId: string;

  @Expose()
  username: string;

  @Expose()
  name?: string;
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

export class RecommendedUserResponse implements RecommendedUser {
  @Expose()
  userId: string;

  @Expose()
  username: string;

  @Expose()
  name?: string;

  @Expose()
  score: number;

  @Expose()
  mutualFriends: number;

  @Expose()
  reason: string;

  @Expose()
  location?: string;
}

export class RecommendationsListResponse {
  @Expose()
  @Type(() => RecommendedUserResponse)
  data: RecommendedUserResponse[];

  @Expose()
  count: number;
}

