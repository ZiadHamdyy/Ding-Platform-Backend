import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UploadedFiles,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PostService } from './post.service';
import { UploadPostFiles } from '../../common/decorators/upload-post-files.decorator';
import { CreatePostDto } from './dtos/create_post.dto';
import { UpdatePostDto } from './dtos/update_post.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { CreateCommentDto } from './dtos/create_comment.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/')
  async getAllPosts(@currentUser('id') userId?: string) {
    return this.postService.getAllPosts(userId);
  }

  @Get('/count')
  @UseGuards(JwtAuthenticationGuard)
  async getMyPostsCount(@currentUser('id') userId: string) {
    return this.postService.getPostsCount(userId);
  }

  @Get('/count/:profileId')
  @UseGuards(JwtAuthenticationGuard)
  async getProfilePostsCount(@Param('profileId') profileId: string) {
    return this.postService.getPostsCount(profileId);
  }


  @Get('/:id')
  async getPostById(
    @Param('id') postId: string,
    @currentUser('id') userId?: string,
  ) {
    return this.postService.getPostById(postId, userId);
  }

  @Post('/create')
  @UseGuards(JwtAuthenticationGuard)
  @UploadPostFiles([
    { name: 'images', maxCount: 5 },
    { name: 'videos', maxCount: 2 },
  ])
  async createPost(
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body() createPostDto: CreatePostDto,
    @currentUser('id') userId: string,
  ) {
    // Override authorId with authenticated user's ID
    createPostDto.authorId = userId;
    return this.postService.createPost(createPostDto, files);
  }

  @Put('/:id')
  @UseGuards(JwtAuthenticationGuard)
  async updatePost(
    @Param('id') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @currentUser('id') userId: string,
  ) {
    return this.postService.updatePost(postId, userId, updatePostDto);
  }

  @Post('/:id/like')
  @UseGuards(JwtAuthenticationGuard)
  async toggleLike(
    @Param('id') postId: string,
    @currentUser('id') userId: string,
  ) {
    return this.postService.toggleLike(postId, userId);
  }

  @Post('/:id/comments')
  @UseGuards(JwtAuthenticationGuard)
  async createComment(
    @Param('id') postId: string,
    @currentUser('id') userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.postService.createComment(postId, userId, createCommentDto);
  }

  @Delete('/comments/:id')
  @UseGuards(JwtAuthenticationGuard)
  async deleteComment(
    @Param('id') commentId: string,
    @currentUser('id') userId: string,
  ) {
    return this.postService.deleteComment(commentId, userId);
  }

  @Get('/:id/comments')
  async getComments(
    @Param('id') postId: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.postService.getComments(postId, page, limit);
  }

  @Get('/:id/likes')
  async getPostLikes(
    @Param('id') postId: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.postService.getPostLikes(postId, page, limit);
  }


  @Delete('/:id')
  @UseGuards(JwtAuthenticationGuard)
  async deletePost(
    @Param('id') postId: string,
    @currentUser('id') userId: string,
  ) {
    return this.postService.deletePost(postId, userId);
  }
}
