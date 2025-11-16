import {
  Controller,
  Query,
  Get,
  Delete,
  Param,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SocialService } from './social.service';
import { currentUser } from 'src/common/decorators/currentUser.decorator';
import { currentUserType } from 'src/common/types/current-user.type';
import { JwtAuthenticationGuard } from 'src/common/guards/strategy.guards/jwt.guard';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import {
  MessageResponse,
  FriendResponse,
  FriendsListResponse,
} from './dtos/response/social.response';

@Controller('social')
@UseGuards(JwtAuthenticationGuard) // Protect all endpoints by default
export class SocialController {
  constructor(private readonly socialservice: SocialService) {}

  // GET routes - static routes before parameterized
  @Get('friends/requests')
  @HttpCode(HttpStatus.OK)
  @Serialize(FriendsListResponse, FriendResponse)
  async getFriendRequests(@currentUser() user: currentUserType) {
    const requests = await this.socialservice.getFriendRequests(user.id);
    return {
      data: requests,
      count: requests.length,
    };
  }

  @Get('friends')
  @HttpCode(HttpStatus.OK)
  @Serialize(FriendsListResponse, FriendResponse)
  async getFriends(
    @currentUser() user: currentUserType,
    @Query('limit') limit?: string,
  ) {
    // Parse limit from query string and convert to number
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const friends = await this.socialservice.getFriends(user.id, limitNum);
    return {
      data: friends,
      count: friends.length,
    };
  }

  // POST routes - parameterized routes
  @Post('friends/request/:toUserId')
  @HttpCode(HttpStatus.OK)
  @Serialize(MessageResponse)
  async sendFriendRequest(
    @Param('toUserId') toUserId: string,
    @currentUser() user: currentUserType,
  ) {
    await this.socialservice.sendFriendRequest(user.id, toUserId);
    return { message: 'Friend request sent' };
  }

  @Post('friends/accept/:fromUserId')
  @HttpCode(HttpStatus.OK)
  @Serialize(MessageResponse)
  async acceptFriendRequest(
    @Param('fromUserId') fromUserId: string,
    @currentUser() user: currentUserType,
  ) {
    await this.socialservice.acceptFriendRequest(fromUserId, user.id);
    return { message: 'Friend request accepted' };
  }

  // DELETE routes - parameterized routes
  @Delete('friends/:userId')
  @HttpCode(HttpStatus.OK)
  @Serialize(MessageResponse)
  async removeFriend(
    @Param('userId') userId: string,
    @currentUser() user: currentUserType,
  ) {
    await this.socialservice.removeFriend(user.id, userId);
    return { message: 'Friend removed' };
  }
}
