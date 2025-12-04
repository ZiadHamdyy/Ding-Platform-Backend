import { Controller, Query, Post, Delete, Param, Get, UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';

@Controller('likes')
export class LikeController {
  constructor(private likeService: LikeService) {}

  @Post('posts/:postId')
  @UseGuards(JwtAuthenticationGuard)
  likePost(
    @Param('postId') postId: string,
    @currentUser('id') userId: string,
  ) {
    return this.likeService.likePost(userId, postId);
  }

  @Delete('posts/:postId')
  @UseGuards(JwtAuthenticationGuard)
  unlikePost(
    @Param('postId') postId: string,
    @currentUser('id') userId: string,
  ) {
    return this.likeService.unlikePost(userId, postId);
  }

  @Post('comments/:commentId')
  @UseGuards(JwtAuthenticationGuard)
  likeComment(
    @Param('commentId') commentId: string,
    @currentUser('id') userId: string,
  ) {
    return this.likeService.likeComment(userId, commentId);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthenticationGuard)
  unlikeComment(
    @Param('commentId') commentId: string,
    @currentUser('id') userId: string,
  ) {
    return this.likeService.unlikeComment(userId, commentId);
  }

  @Get('posts/:postId')
  getPostLikes(
    @Param('postId') postId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.likeService.getPostLikes(postId, +page, +limit);
  }
}
