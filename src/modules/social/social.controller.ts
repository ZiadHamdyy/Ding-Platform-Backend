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
  async toggleSendFriendRequest(
    @Param('toUserId') toUserId: string,
    @currentUser() user: currentUserType,
  ) {
    await this.socialservice.toggleSendFriendRequest(user.id, toUserId);
    return { message: 'Friend request toggled' };
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

  // Followers endpoints
  @Post('follow/:userId')
  @HttpCode(HttpStatus.OK)
  @Serialize(MessageResponse)
  async followUser(
    @Param('userId') userId: string,
    @currentUser() user: currentUserType,
  ) {
    await this.socialservice.followUser(user.id, userId);
    return { message: 'User followed' };
  }

  @Delete('follow/:userId')
  @HttpCode(HttpStatus.OK)
  @Serialize(MessageResponse)
  async unfollowUser(
    @Param('userId') userId: string,
    @currentUser() user: currentUserType,
  ) {
    await this.socialservice.unfollowUser(user.id, userId);
    return { message: 'User unfollowed' };
  }

  @Get('followers')
  @HttpCode(HttpStatus.OK)
  @Serialize(FriendsListResponse, FriendResponse)
  async getFollowers(
    @currentUser() user: currentUserType,
    @Query('limit') limit?: string,
  ) {
    // Parse limit from query string and convert to number
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const followers = await this.socialservice.getFollowers(user.id, limitNum);
    return {
      data: followers,
      count: followers.length,
    };
  }

  @Get('following')
  @HttpCode(HttpStatus.OK)
  @Serialize(FriendsListResponse, FriendResponse)
  async getFollowing(
    @currentUser() user: currentUserType,
    @Query('limit') limit?: string,
  ) {
    // Parse limit from query string and convert to number
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const following = await this.socialservice.getFollowing(user.id, limitNum);
    return {
      data: following,
      count: following.length,
    };
  }
}
