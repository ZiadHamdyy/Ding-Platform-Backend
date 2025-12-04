import { Controller, Query, Post, Delete, Param, Get, Request } from '@nestjs/common';
import { LikeService } from './like.service';

@Controller('likes')
export class LikeController {
  constructor(private likeService: LikeService) {}

  @Post('posts/:postId')
  likePost(@Param('postId') postId: string, @Request() req) {
    return this.likeService.likePost(req.user.id, postId);
  }

  @Delete('posts/:postId')
  unlikePost(@Param('postId') postId: string, @Request() req) {
    return this.likeService.unlikePost(req.user.id, postId);
  }

  @Post('comments/:commentId')
  likeComment(@Param('commentId') commentId: string, @Request() req) {
    return this.likeService.likeComment(req.user.id, commentId);
  }

  @Delete('comments/:commentId')
  unlikeComment(@Param('commentId') commentId: string, @Request() req) {
    return this.likeService.unlikeComment(req.user.id, commentId);
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
