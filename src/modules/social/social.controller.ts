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
  RecommendedUserResponse,
  RecommendationsListResponse,
} from './dtos/response/social.response';

@Controller('social')
@UseGuards(JwtAuthenticationGuard) // Protect all endpoints by default
export class SocialController {
  constructor(private readonly socialservice: SocialService) {}

  // GET routes - static routes before parameterized
  @Get('friends/requests')
  @HttpCode(HttpStatus.OK)
  @Serialize(FriendsListResponse, FriendResponse)
  async getFriendRequests(
    @currentUser() user: currentUserType,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    // Parse offset and limit from query string and convert to numbers
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.socialservice.getFriendRequests(user.id, offsetNum, limitNum);
  }

  @Get('friends')
  @HttpCode(HttpStatus.OK)
  @Serialize(FriendsListResponse, FriendResponse)
  async getFriends(
    @currentUser() user: currentUserType,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    // Parse offset and limit from query string and convert to numbers
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.socialservice.getFriends(user.id, offsetNum, limitNum);
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
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    // Parse offset and limit from query string and convert to numbers
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.socialservice.getFollowers(user.id, offsetNum, limitNum);
  }

  @Get('following')
  @HttpCode(HttpStatus.OK)
  @Serialize(FriendsListResponse, FriendResponse)
  async getFollowing(
    @currentUser() user: currentUserType,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    // Parse offset and limit from query string and convert to numbers
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.socialservice.getFollowing(user.id, offsetNum, limitNum);
  }

  // Recommendations
  @Get('recommendations/friends')
  @HttpCode(HttpStatus.OK)
  @Serialize(RecommendationsListResponse, RecommendedUserResponse)
  async getFriendRecommendations(
    @currentUser() user: currentUserType,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    // Parse offset and limit from query string and convert to numbers
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.socialservice.getFriendRecommendations(
      user.id,
      offsetNum,
      limitNum,
    );
  }

  @Get('recommendations/follow')
  @HttpCode(HttpStatus.OK)
  @Serialize(RecommendationsListResponse, RecommendedUserResponse)
  async getFollowerRecommendations(
    @currentUser() user: currentUserType,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    // Parse offset and limit from query string and convert to numbers
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.socialservice.getFollowerRecommendations(
      user.id,
      offsetNum,
      limitNum,
    );
  }

  // Stats
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getNetworkStats(@currentUser() user: currentUserType) {
    return this.socialservice.getUserNetworkStats(user.id);
  }

  @Get('mutual-friends/:userId')
  @HttpCode(HttpStatus.OK)
  @Serialize(FriendsListResponse, FriendResponse)
  async getMutualFriends(
    @Param('userId') userId: string,
    @currentUser() user: currentUserType,
  ) {
    const mutualFriends = await this.socialservice.getMutualFriends(
      user.id,
      userId,
    );
    return {
      data: mutualFriends,
      count: mutualFriends.length,
    };
  }
}
