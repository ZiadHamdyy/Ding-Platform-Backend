import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthenticationGuard)
  @Post('posts/:postId')
  createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @currentUser('id') userId: string,
  ) {
    return this.commentService.createComment(postId, userId, dto);
  }

  @Get('posts/:postId')
  getPostComments(
    @Param('postId') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    @Query('sort') sort: 'top' | 'recent' = 'top',
  ) {
    return this.commentService.getPostComments(
      postId,
      page,
      limit,
      sort === 'recent' ? 'recent' : 'top',
    );
  }

  @Get(':commentId/replies')
  getCommentReplies(
    @Param('commentId') commentId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.commentService.getCommentReplies(
      commentId,
      page,
      limit,
    );
  }

  @UseGuards(JwtAuthenticationGuard)
  @Patch(':commentId')
  updateComment(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @currentUser('id') userId: string,
  ) {
    return this.commentService.updateComment(commentId, userId, dto);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Delete(':commentId')
  deleteComment(
    @Param('commentId') commentId: string,
    @currentUser('id') userId: string,
  ) {
    return this.commentService.deleteComment(commentId, userId);
  }

}
