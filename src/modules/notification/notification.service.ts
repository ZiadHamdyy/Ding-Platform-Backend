import { Injectable, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';

export enum NotificationType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_REQUEST_ACCEPTED = 'FRIEND_REQUEST_ACCEPTED',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM',
}

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Create a notification
   */
  async createNotification(data: {
    userId: string;
    actorId?: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId: data.userId,
          actorId: data.actorId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          read: false,
        },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't throw error - notifications shouldn't break main flow
      return null;
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: any = { userId };

      if (unreadOnly) {
        where.read = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          include: {
            actor: {
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
        this.prisma.notification.count({ where }),
        this.prisma.notification.count({
          where: { userId, read: false },
        }),
      ]);

      return {
        data: notifications,
        meta: {
          page,
          limit,
          total,
          unreadCount,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new GenericHttpException(
        'Failed to get notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new GenericHttpException(
          'Notification not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return await this.prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        'Failed to mark notification as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    try {
      await this.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return { success: true };
    } catch (error) {
      throw new GenericHttpException(
        'Failed to mark all notifications as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new GenericHttpException(
          'Notification not found',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.notification.delete({
        where: { id: notificationId },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        'Failed to delete notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(userId: string) {
    try {
      await this.prisma.notification.deleteMany({
        where: { userId },
      });
      return { success: true };
    } catch (error) {
      throw new GenericHttpException(
        'Failed to delete notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, read: false },
      });
      return { count };
    } catch (error) {
      throw new GenericHttpException(
        'Failed to get unread count',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper methods for creating specific notification types

  async notifyFriendRequest(fromUserId: string, toUserId: string) {
    const fromUser = await this.prisma.user.findUnique({
      where: { id: fromUserId },
      select: { name: true },
    });

    return this.createNotification({
      userId: toUserId,
      actorId: fromUserId,
      type: NotificationType.FRIEND_REQUEST,
      title: 'New Friend Request',
      message: `${fromUser?.name || 'Someone'} sent you a friend request`,
      data: { fromUserId },
    });
  }

  async notifyFriendRequestAccepted(fromUserId: string, toUserId: string) {
    const fromUser = await this.prisma.user.findUnique({
      where: { id: fromUserId },
      select: { name: true },
    });

    return this.createNotification({
      userId: toUserId,
      actorId: fromUserId,
      type: NotificationType.FRIEND_REQUEST_ACCEPTED,
      title: 'Friend Request Accepted',
      message: `${fromUser?.name || 'Someone'} accepted your friend request`,
      data: { fromUserId },
    });
  }

  async notifyNewFollower(followerId: string, followedId: string) {
    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
      select: { name: true },
    });

    return this.createNotification({
      userId: followedId,
      actorId: followerId,
      type: NotificationType.NEW_FOLLOWER,
      title: 'New Follower',
      message: `${follower?.name || 'Someone'} started following you`,
      data: { followerId },
    });
  }

  async notifyPostLike(likerId: string, postAuthorId: string, postId: string) {
    if (likerId === postAuthorId) return; // Don't notify self-likes

    const liker = await this.prisma.user.findUnique({
      where: { id: likerId },
      select: { name: true },
    });

    return this.createNotification({
      userId: postAuthorId,
      actorId: likerId,
      type: NotificationType.POST_LIKE,
      title: 'New Like',
      message: `${liker?.name || 'Someone'} liked your post`,
      data: { postId, likerId },
    });
  }

  async notifyPostComment(commenterId: string, postAuthorId: string, postId: string, commentContent: string) {
    if (commenterId === postAuthorId) return; // Don't notify self-comments

    const commenter = await this.prisma.user.findUnique({
      where: { id: commenterId },
      select: { name: true },
    });

    const truncatedContent = commentContent.length > 50 
      ? commentContent.substring(0, 50) + '...' 
      : commentContent;

    return this.createNotification({
      userId: postAuthorId,
      actorId: commenterId,
      type: NotificationType.POST_COMMENT,
      title: 'New Comment',
      message: `${commenter?.name || 'Someone'} commented: "${truncatedContent}"`,
      data: { postId, commenterId },
    });
  }
}
