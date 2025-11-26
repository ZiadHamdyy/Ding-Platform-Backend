import { Injectable, HttpStatus, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from 'src/configs/database/database.service';
import { HelperService } from 'src/common/utils/helper/helper.service';
import { CloudinaryService } from 'src/common/services/cloudinary/cloudinary.service';
import { GenericHttpException } from 'src/common/application/exceptions/generic-http-exception';
import { ERROR_MESSAGES } from 'src/common/constants/error-messages.constant';
import { POST_CONSTANTS } from 'src/common/constants/post.constants';
import { CreatePostDto, PostPrivacy } from './dtos/create_post.dto';
import { UpdatePostDto } from './dtos/update_post.dto';
import { NotificationService } from '../notification/notification.service';
import { CreateCommentDto } from './dtos/create_comment.dto';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly helperService: HelperService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAllPosts(userId?: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        PostMedia: true,
        _count: {
          select: {
            Likes: true,
            Comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!posts || posts.length === 0) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.POSTS_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return posts;
  }

  async getPostById(postId: string, userId?: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        PostMedia: true,
        PostAudience: true,
        _count: {
          select: {
            Likes: true,
            Comments: true,
          },
        },
      },
    });

    if (!post) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.POST_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return post;
  }

  async createPost(
    data: CreatePostDto,
    files?: Record<string, Express.Multer.File[]>,
  ) {
    try {
      // Validate content length
      this.validatePostContent(data.content);

      // Validate media count
      if (files) {
        this.validateMediaCount(files);
      }

      // Create post first to get the ID
      const newPost = await this.prisma.post.create({
        data: {
          content: data.content,
          authorId: data.authorId,
          privacy: data.privacy as PostPrivacy,
        },
      });

      let mediaUrls: string[] = [];
      const mediaRecords: Array<{
        url: string;
        type: 'IMAGE' | 'VIDEO';
        publicId: string;
        size: number;
        width: number;
        height: number;
      }> = [];

      // Upload media if provided
      if (files && (files.images || files.videos)) {
        const uploadResult =
          await this.cloudinaryService.uploadMultiplePostMedia(
            {
              images: files.images,
              videos: files.videos,
            },
            newPost.id,
          );

        // Process images
        if (uploadResult.imageUrls.length > 0) {
          for (const img of uploadResult.imageUrls) {
            mediaUrls.push(img.url);
            mediaRecords.push({
              url: img.url,
              type: 'IMAGE',
              publicId: img.publicId,
              size: files.images?.find(() => true)?.size || 0,
              width: img.width,
              height: img.height,
            });
          }
        }

        // Process videos
        if (uploadResult.videoUrls.length > 0) {
          for (const vid of uploadResult.videoUrls) {
            mediaUrls.push(vid.url);
            mediaRecords.push({
              url: vid.url,
              type: 'VIDEO',
              publicId: vid.publicId,
              size: files.videos?.find(() => true)?.size || 0,
              width: vid.width,
              height: vid.height,
            });
          }
        }

        // Update post with media URLs
        await this.prisma.post.update({
          where: { id: newPost.id },
          data: { mediaUrls },
        });

        // Create media records
        if (mediaRecords.length > 0) {
          await this.prisma.postMedia.createMany({
            data: mediaRecords.map((media) => ({
              postId: newPost.id,
              ...media,
            })),
          });
        }
      }

      // Handle custom audience
      if (
        data.privacy === 'CUSTOM' &&
        data.customAudienceIds &&
        data.customAudienceIds.length > 0
      ) {
        await this.prisma.postAudience.createMany({
          data: data.customAudienceIds.map((userId) => ({
            postId: newPost.id,
            userId,
          })),
        });
      }

      // Create post history
      await this.createPostHistory(
        newPost.id,
        data.content,
        mediaUrls,
        data.privacy as PostPrivacy,
        'CREATED',
      );

      return this.getPostById(newPost.id);
    } catch (error) {
      console.error('Post creation error:', error);
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.POST_CREATION_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePost(postId: string, userId: string, data: UpdatePostDto) {
    try {
      // Check post exists and user owns it
      await this.checkPostOwnership(postId, userId);

      // Validate content if provided
      if (data.content) {
        this.validatePostContent(data.content);
      }

      const updateData: any = {};
      if (data.content !== undefined) updateData.content = data.content;
      if (data.privacy !== undefined) updateData.privacy = data.privacy;

      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: updateData,
      });

      // Handle custom audience update
      if (data.privacy === 'CUSTOM' && data.customAudienceIds) {
        // Remove old audience
        await this.prisma.postAudience.deleteMany({
          where: { postId },
        });

        // Add new audience
        if (data.customAudienceIds.length > 0) {
          await this.prisma.postAudience.createMany({
            data: data.customAudienceIds.map((uid) => ({
              postId,
              userId: uid,
            })),
          });
        }
      }

      // Create history record
      await this.createPostHistory(
        postId,
        updatedPost.content,
        updatedPost.mediaUrls,
        updatedPost.privacy as PostPrivacy,
        'UPDATED',
      );

      return this.getPostById(postId);
    } catch (error) {
      console.error('Post update error:', error);
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.POST_UPDATE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deletePost(postId: string, userId: string) {
    try {
      // Check post exists and user owns it
      const post = await this.checkPostOwnership(postId, userId);

      if (post.isDeleted) {
        throw GenericHttpException.createLocalized(
          ERROR_MESSAGES.POST_ALREADY_DELETED,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Soft delete
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // Create history record
      await this.createPostHistory(
        postId,
        post.content,
        post.mediaUrls,
        post.privacy as PostPrivacy,
        'DELETED',
      );

      return { message: 'Post deleted successfully' };
    } catch (error) {
      console.error('Post delete error:', error);
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.POST_DELETE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Validation methods
  private validatePostContent(content: string): void {
    if (content.length > POST_CONSTANTS.VALIDATION.MAX_CONTENT_LENGTH) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.POST_CONTENT_TOO_LONG,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateMediaCount(files: Record<string, Express.Multer.File[]>): void {
    const imageCount = files.images?.length || 0;
    const videoCount = files.videos?.length || 0;

    if (imageCount > POST_CONSTANTS.VALIDATION.MAX_IMAGES) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.POST_TOO_MANY_IMAGES,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (videoCount > POST_CONSTANTS.VALIDATION.MAX_VIDEOS) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.POST_TOO_MANY_VIDEOS,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Helper methods
  private async checkPostOwnership(postId: string, userId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId },
    });

    if (!post) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.POST_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(ERROR_MESSAGES.POST_UNAUTHORIZED);
    }

    return post;
  }

  private async createPostHistory(
    postId: string,
    content: string,
    mediaUrls: string[],
    privacy: PostPrivacy,
    changeType: 'CREATED' | 'UPDATED' | 'DELETED' | 'RESTORED',
  ): Promise<void> {
    await this.prisma.postHistory.create({
      data: {
        postId,
        content,
        mediaUrls,
        privacy,
        changeType,
      },
    });
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.getPostById(postId);

    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return { liked: false };
    } else {
      await this.prisma.like.create({
        data: {
          postId,
          userId,
        },
      });

      // Notify post author
      await this.notificationService.notifyPostLike(userId, post.authorId, postId);

      return { liked: true };
    }
  }

  async createComment(postId: string, userId: string, dto: CreateCommentDto) {
    const post = await this.getPostById(postId);

    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentComment) {
        throw new GenericHttpException(
          ERROR_MESSAGES.COMMENT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      if (parentComment.postId !== postId) {
        throw new GenericHttpException(
          'Parent comment does not belong to this post',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId: userId,
        parentId: dto.parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Notify post author
    await this.notificationService.notifyPostComment(
      userId,
      post.authorId,
      postId,
      comment.content,
    );

    return comment;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new GenericHttpException(
        ERROR_MESSAGES.COMMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (comment.authorId !== userId) {
      throw new GenericHttpException(
        ERROR_MESSAGES.COMMENT_UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }

  async getComments(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          parentId: null, // Fetch top-level comments
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
            take: 3, // Preview 3 replies
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          postId,
          parentId: null,
        },
      }),
    ]);

    return {
      data: comments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPostLikes(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.like.count({ where: { postId } }),
    ]);

    return {
      data: likes.map((like) => like.user),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPostsCount(profileId: string) {
    const postsCount = await this.prisma.post.count({
      where: {
        authorId: profileId,
        isDeleted: false,
      },
    });

    return { postsCount };
  }
}
