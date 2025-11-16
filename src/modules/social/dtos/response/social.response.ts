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

export class FriendsListResponse {
  @Expose()
  @Type(() => FriendResponse)
  data: FriendResponse[];

  @Expose()
  count: number;
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

