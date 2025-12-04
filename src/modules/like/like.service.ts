import { Injectable, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { Neo4jService } from '../../configs/neo4j/neo4j.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Prisma } from '@prisma/client';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';

export enum LikeableType {
  POST = 'POST',
  COMMENT = 'COMMENT'
}

@Injectable()
export class LikeService {
  constructor(
    private prisma: DatabaseService,
    private neo4j: Neo4jService,
    @InjectQueue('graph-sync') private graphQueue: Queue,
  ) {}

  /**
   * Create or update the LIKE relationship in Neo4j between a user and a post.
   */
  private async syncLikeInGraph(userId: string, postId: string): Promise<void> {
    const session = this.neo4j.getSession();
    try {
      await session.run(
        `
        MERGE (u:User {userId: $userId})
        MERGE (p:Post {postId: $postId})
        MERGE (u)-[r:LIKES_POST]->(p)
        SET r.createdAt = coalesce(r.createdAt, datetime()),
            r.updatedAt = datetime()
        `,
        { userId, postId },
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Remove the LIKE relationship in Neo4j between a user and a post.
   */
  private async removeLikeFromGraph(
    userId: string,
    postId: string,
  ): Promise<void> {
    const session = this.neo4j.getSession();
    try {
      await session.run(
        `
        MATCH (u:User {userId: $userId})-[r:LIKES_POST]->(p:Post {postId: $postId})
        DELETE r
        `,
        { userId, postId },
      );
    } finally {
      await session.close();
    }
  }

  async likePost(userId: string, postId: string) {
    // Check if post exists
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new GenericHttpException(
        ERROR_MESSAGES.POST_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if already liked (uses unique index on (userId, postId) in DB)
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      } as unknown as Prisma.LikeWhereUniqueInput,
    });

    if (existingLike) {
      throw new GenericHttpException(
        ERROR_MESSAGES.POST_ALREADY_LIKED,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Transaction: Create like in relational DB
    const result = await this.prisma.$transaction(async (tx) => {
      const like = await tx.like.create({
        data: { userId, postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return like;
    });

    // Get updated likes count for the post
    const likesCount = await this.prisma.like.count({
      where: { postId },
    });

    // Update Neo4j graph
    await this.syncLikeInGraph(userId, postId);

    // Async: enqueue background sync job if additional processing is needed
    await this.graphQueue.add('sync-like', {
      userId,
      postId,
      action: 'LIKE',
      timestamp: new Date(),
    });

    return {
      ...result,
      likesCount,
    };
  }

  async unlikePost(userId: string, postId: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      } as unknown as Prisma.LikeWhereUniqueInput,
    });

    if (!like) {
      throw new GenericHttpException(
        ERROR_MESSAGES.LIKE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.like.delete({ where: { id: like.id } });
      
      // We intentionally don't maintain a manual likeCount column here.
    });

    // Update Neo4j graph
    await this.removeLikeFromGraph(userId, postId);

    // Async: enqueue background sync job if additional processing is needed
    await this.graphQueue.add('sync-like', {
      userId,
      postId,
      action: 'UNLIKE',
    });

    return { success: true };
  }

  async likeComment(userId: string, commentId: string) {
    // Comment likes are not supported by the current Prisma Like model (it only relates users and posts).
    // This method is kept for API compatibility but explicitly disabled until the schema is updated.
    throw new GenericHttpException(
      ERROR_MESSAGES.COMMENT_LIKES_NOT_SUPPORTED,
      HttpStatus.BAD_REQUEST,
    );
  }

  async unlikeComment(userId: string, commentId: string) {
    // See note in likeComment – comment likes are not yet modeled in Prisma.
    throw new GenericHttpException(
      ERROR_MESSAGES.COMMENT_LIKES_NOT_SUPPORTED,
      HttpStatus.BAD_REQUEST,
    );
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
      data: likes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async hasUserLiked(userId: string, postId?: string, commentId?: string) {
    if (postId) {
      const like = await this.prisma.like.findUnique({
        where: {
          userId_postId: { userId, postId },
        } as unknown as Prisma.LikeWhereUniqueInput,
      });
      return !!like;
    }
    
    if (commentId) {
      // Uses @@unique([userId, commentId]) index efficiently
      // Note: Type assertion needed because Prisma client may be out of sync
      const like = await this.prisma.like.findFirst({
        where: { userId, commentId } as Prisma.LikeWhereInput,
      });
      return !!like;
    }

    return false;
  }
}
