import { Expose, Type } from 'class-transformer';
import { UserNode } from '../../../../common/interfaces/user.interface';

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

