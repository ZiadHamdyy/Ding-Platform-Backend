import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DatabaseService } from '../../configs/database/database.service';
import { NotificationService } from '../notification/notification.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { CommentResponseDto } from './dtos/comment-response.dto';
import { PaginatedResponse } from '../../common/dtos/pagination.dto';
import { Prisma } from '@prisma/client';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';

type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
    _count: {
      select: {
        replies: true;
      };
    };
  };
}>;

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly notificationService: NotificationService,
    @InjectQueue('graph-sync') private readonly graphQueue: Queue,
  ) {}

  async createComment(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, isDeleted: false },
      select: { id: true, authorId: true },
    });

    if (!post) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.POST_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    let parentComment: { id: string; parentId: string | null } | null = null;

    if (dto.parentCommentId) {
      parentComment = await this.prisma.comment.findUnique({
        where: { id: dto.parentCommentId },
        select: { id: true, parentId: true },
      });

      if (!parentComment) {
        throw GenericHttpException.createLocalized(
          ERROR_MESSAGES.COMMENT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      if (parentComment.parentId) {
        throw GenericHttpException.createLocalized(
          ERROR_MESSAGES.COMMENT_NESTING_NOT_ALLOWED,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const createdComment = await tx.comment.create({
        data: {
          content: dto.content,
          postId,
          authorId,
          parentId: dto.parentCommentId,
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
            select: { replies: true },
          },
        },
      });

      return createdComment;
    });

    await this.enqueueCommentSync({
      userId: authorId,
      postId,
      commentId: comment.id,
      timestamp: comment.createdAt,
    });

    try {
      await this.notificationService.notifyPostComment(
        authorId,
        post.authorId,
        postId,
        comment.content,
      );
    } catch (notificationError) {
      console.error('Failed to send comment notification', notificationError);
    }

    return this.toCommentResponse(comment);
  }

  async getPostComments(
    postId: string,
    page = 1,
    limit = 20,
    sort: 'top' | 'recent' = 'top',
  ): Promise<PaginatedResponse<CommentResponseDto>> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
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

    if (sort === 'top') {
      comments.sort((a, b) => {
        const replyDiff =
          (b._count?.replies ?? 0) - (a._count?.replies ?? 0);
        if (replyDiff !== 0) {
          return replyDiff;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    return {
      data: comments.map((comment) => this.toCommentResponse(comment)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCommentReplies(
    commentId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<CommentResponseDto>> {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          parentId: commentId,
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
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          parentId: commentId,
        },
      }),
    ]);

    return {
      data: replies.map((reply) => this.toCommentResponse(reply)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateComment(
    commentId: string,
    authorId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const existingComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.COMMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingComment.authorId !== authorId) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.COMMENT_UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
      );
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
        updatedAt: new Date(),
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
      },
    });

    return this.toCommentResponse(updatedComment);
  }

  async deleteComment(commentId: string, authorId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.COMMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (comment.authorId !== authorId) {
      throw GenericHttpException.createLocalized(
        ERROR_MESSAGES.COMMENT_UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.delete({
        where: { id: commentId },
      });
    });

    await this.enqueueCommentSync({
      userId: authorId,
      postId: comment.postId,
      commentId,
      timestamp: new Date(),
      action: 'DELETE',
    });

    return { success: true };
  }

  private toCommentResponse(
    comment: CommentWithAuthor,
  ): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      parentCommentId: comment.parentId,
      replyCount: comment._count?.replies ?? 0,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author
        ? {
            id: comment.author.id,
            name: comment.author.name,
            image: comment.author.image,
          }
        : null,
    };
  }

  private async enqueueCommentSync(payload: {
    userId: string;
    postId: string;
    commentId: string;
    timestamp: Date;
    action?: 'DELETE';
  }) {
    try {
      await this.graphQueue.add('sync-comment', payload);
    } catch (error) {
      console.error('Failed to enqueue comment sync job', error);
    }
  }
}
