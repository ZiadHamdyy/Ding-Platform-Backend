import { Injectable, HttpStatus } from '@nestjs/common';
import { Neo4jService } from 'src/configs/neo4j/neo4j.service';
import { DatabaseService } from 'src/configs/database/database.service';
import { UserNode } from 'src/common/interfaces/user.interface';
import { GenericHttpException } from 'src/common/application/exceptions/generic-http-exception';
import { ERROR_MESSAGES } from 'src/common/constants/error-messages.constant';
import neo4j from 'neo4j-driver';
import { Profile, User } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SocialService {
  constructor(
    private readonly neo4jservice: Neo4jService,
    private readonly prisma: DatabaseService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Safely convert Neo4j Integer or Float to JavaScript number
   */
  private toNumber(value: any): number {
    if (value == null) {
      return 0;
    }
    // Neo4j Integer has toNumber() method
    if (typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    // Already a number (Float or regular number)
    if (typeof value === 'number') {
      return value;
    }
    // Fallback: try to parse as number
    return Number(value) || 0;
  }

  /**
   * Check if a user node exists in Neo4j
   */
  private async userExists(userId: string): Promise<boolean> {
    const session = this.neo4jservice.getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {userId: $userId})
             RETURN count(u) > 0 as exists`,
        { userId },
      );
      return result.records[0].get('exists');
    } finally {
      await session.close();
    }
  }

  /**
   * Check if a friend request exists
   */
  private async friendRequestExists(
    fromUserId: string,
    toUserId: string,
  ): Promise<boolean> {
    const session = this.neo4jservice.getSession();
    try {
      const result = await session.run(
        `MATCH (from:User {userId: $fromUserId})-[r:FRIEND_REQUEST]->(to:User {userId: $toUserId})
             RETURN count(r) > 0 as exists`,
        { fromUserId, toUserId },
      );
      return result.records[0].get('exists');
    } finally {
      await session.close();
    }
  }

  async createUserNode(
    userId: string,
    data?: {
      name?: string | null;
      username?: string | null;
      location?: string | null;
      coverPhoto?: string | null;
    },
  ): Promise<void> {
    const session = this.neo4jservice.getSession();
    try {
      await session.run(
        `MERGE (u:User {userId: $userId})
             SET u.id = $userId,
                 u.name = $name,
                 u.username = $username,
                 u.location = $location,
                 u.coverPhoto = $coverPhoto,
                 u.updatedAt = datetime()`,
        {
          userId,
          name: data?.name ?? null,
          username: data?.username ?? null,
          location: data?.location ?? null,
          coverPhoto: data?.coverPhoto ?? null,
        },
      );
    } finally {
      await session.close();
    }
  }
  async deleteUserNode(userId: string): Promise<void> {
    const session = this.neo4jservice.getSession();
    try {
      await session.run(
        `MATCH (u:User {userId: $userId})
             DETACH DELETE u`,
        { userId },
      );
    } finally {
      await session.close();
    }
  }

  async toggleSendFriendRequest(
    fromUserId: string,
    toUserId: string,
  ): Promise<void> {
    // Validate: Cannot send friend request to yourself
    if (fromUserId === toUserId) {
      throw new GenericHttpException(
        ERROR_MESSAGES.CANNOT_SEND_FRIEND_REQUEST_TO_SELF,
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = this.neo4jservice.getSession();
    try {
      // Check if both users exist
      const fromUserExists = await this.userExists(fromUserId);
      const toUserExists = await this.userExists(toUserId);

      if (!fromUserExists || !toUserExists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if already friends
      const alreadyFriends = await this.areFriends(fromUserId, toUserId);
      if (alreadyFriends) {
        throw new GenericHttpException(
          ERROR_MESSAGES.ALREADY_FRIENDS,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if there's a reverse friend request (they sent you one)
      const reverseRequestExists = await this.friendRequestExists(
        toUserId,
        fromUserId,
      );
      if (reverseRequestExists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.ALREADY_HAVE_FRIEND_REQUEST,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if friend request already exists - if so, delete it (toggle off)
      const requestExists = await this.friendRequestExists(
        fromUserId,
        toUserId,
      );
      if (requestExists) {
        // Delete the existing friend request
        await session.run(
          `MATCH (from:User {userId: $fromUserId})-[r:FRIEND_REQUEST]->(to:User {userId: $toUserId})
               DELETE r`,
          { fromUserId, toUserId },
        );
      } else {
        // Create friend request (toggle on)
        await session.run(
          `MATCH (from:User {userId: $fromUserId})
               MATCH (to:User {userId: $toUserId})
               MERGE (from)-[r:FRIEND_REQUEST]->(to)
               SET r.createdAt = datetime()`,
          { fromUserId, toUserId },
        );
        // Send notification
        await this.notificationService.notifyFriendRequest(
          fromUserId,
          toUserId,
        );
      }
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        ERROR_MESSAGES.FRIEND_REQUEST_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  async acceptFriendRequest(
    fromUserId: string,
    toUserId: string,
  ): Promise<void> {
    const session = this.neo4jservice.getSession();
    try {
      // Check if both users exist
      const fromUserExists = await this.userExists(fromUserId);
      const toUserExists = await this.userExists(toUserId);

      if (!fromUserExists || !toUserExists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if already friends
      const alreadyFriends = await this.areFriends(fromUserId, toUserId);
      if (alreadyFriends) {
        throw new GenericHttpException(
          ERROR_MESSAGES.ALREADY_FRIENDS,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if friend request exists
      const requestExists = await this.friendRequestExists(
        fromUserId,
        toUserId,
      );
      if (!requestExists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.FRIEND_REQUEST_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      // Remove request and create bidirectional friendship
      const result = await session.run(
        `MATCH (from:User {userId: $fromUserId})-[r:FRIEND_REQUEST]->(to:User {userId: $toUserId})
             DELETE r
             MERGE (from)-[:FRIENDS {createdAt: datetime()}]->(to)
             MERGE (to)-[:FRIENDS {createdAt: datetime()}]->(from)
             RETURN count(r) as deleted`,
        { fromUserId, toUserId },
      );

      // Verify the request was deleted
      if (result.records[0].get('deleted').toNumber() === 0) {
        throw new GenericHttpException(
          ERROR_MESSAGES.FRIEND_REQUEST_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        ERROR_MESSAGES.ACCEPT_FRIEND_REQUEST_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // notify the user that their friend request was accepted
      await this.notificationService.notifyFriendRequestAccepted(
        toUserId,
        fromUserId,
      );
      await session.close();
    }
  }

  async removeFriend(userId1: string, userId2: string): Promise<void> {
    const session = this.neo4jservice.getSession();
    try {
      // Check if both users exist
      const user1Exists = await this.userExists(userId1);
      const user2Exists = await this.userExists(userId2);

      if (!user1Exists || !user2Exists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if they are friends
      const areFriends = await this.areFriends(userId1, userId2);
      if (!areFriends) {
        throw new GenericHttpException(
          ERROR_MESSAGES.NOT_FRIENDS,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Delete both directions of the friendship relationship
      const result = await session.run(
        `MATCH (u1:User {userId: $userId1})-[r:FRIENDS]-(u2:User {userId: $userId2})
             DELETE r
             RETURN count(r) as deleted`,
        { userId1, userId2 },
      );

      // Verify the friendship was deleted (should be 2 for bidirectional, but at least 1)
      const deletedCount = result.records[0].get('deleted').toNumber();
      if (deletedCount === 0) {
        throw new GenericHttpException(
          ERROR_MESSAGES.NOT_FRIENDS,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        ERROR_MESSAGES.REMOVE_FRIEND_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  async getFriends(
    userId: string,
    offset = 0,
    limit = 10,
  ): Promise<{
    data: (Profile & { user: User })[];
    meta: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
      nextOffset: number | null;
    };
  }> {
    const session = this.neo4jservice.getSession();
    try {
      // Check if user exists in Neo4j
      let userExists = await this.userExists(userId);

      // If user doesn't exist in Neo4j, try to create it from PostgreSQL
      if (!userExists) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            Profile: {
              select: {
                location: true,
                coverPhoto: true,
              },
            },
          },
        });

        if (user) {
          // Auto-create the node in Neo4j
          await this.createUserNode(user.id, {
            name: user.name,
            username: user.email,
            location: user.Profile?.location ?? null,
            coverPhoto: user.Profile?.coverPhoto ?? null,
          });
          userExists = true;
        } else {
          throw new GenericHttpException(
            ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      // Ensure offset and limit are integers (Neo4j requires integer, not float)
      const offsetInt = Math.floor(Number(offset)) || 0;
      const limitInt = Math.floor(Number(limit)) || 10;
      
      if (offsetInt < 0) {
        throw new GenericHttpException(
          'Offset must be a non-negative integer',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (limitInt < 1) {
        throw new GenericHttpException(
          'Limit must be a positive integer',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get total count of friends
      const countResult = await session.run(
        `MATCH (u:User {userId: $userId})-[:FRIENDS]->(friend:User)
             RETURN count(friend) as total`,
        { userId },
      );
      const total = this.toNumber(countResult.records[0]?.get('total') || 0);

      // Get friend userIds from Neo4j
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:FRIENDS]->(friend:User)
             RETURN friend.userId as userId
             SKIP $offset
             LIMIT $limit`,
        { userId, offset: neo4j.int(offsetInt), limit: neo4j.int(limitInt) },
      );
      
      const friendIds = result.records.map((r) => r.get('userId'));

      // Batch fetch profile details from PostgreSQL with all data
      const profiles = await this.prisma.profile.findMany({
        where: { userId: { in: friendIds } },
        include: {
          user: true,
        },
      });

      // Create a map for quick lookup
      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      // Return full profile data, preserving order from Neo4j
      const friends = friendIds
        .map((id) => profileMap.get(id))
        .filter((p): p is Profile & { user: User } => p !== undefined);

      // Calculate pagination metadata
      const hasMore = offsetInt + limitInt < total;
      const nextOffset = hasMore ? offsetInt + limitInt : null;

      return {
        data: friends,
        meta: {
          limit: limitInt,
          offset: offsetInt,
          total,
          hasMore,
          nextOffset,
        },
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      // Log the actual error for debugging
      console.error('Error in getFriends:', error);
      throw new GenericHttpException(
        ERROR_MESSAGES.GET_FRIENDS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  async getFriendRequests(
    userId: string,
    offset = 0,
    limit = 10,
  ): Promise<{
    data: (Profile & { user: User })[];
    meta: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
      nextOffset: number | null;
    };
  }> {
    const session = this.neo4jservice.getSession();
    try {
      // Check if user exists in Neo4j
      let userExists = await this.userExists(userId);

      // If user doesn't exist in Neo4j, try to create it from PostgreSQL
      if (!userExists) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            Profile: {
              select: {
                location: true,
                coverPhoto: true,
              },
            },
          },
        });

        if (user) {
          // Auto-create the node in Neo4j
          await this.createUserNode(user.id, {
            name: user.name,
            username: user.email,
            location: user.Profile?.location ?? null,
            coverPhoto: user.Profile?.coverPhoto ?? null,
          });
          userExists = true;
        } else {
          throw new GenericHttpException(
            ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      // Ensure offset and limit are integers (Neo4j requires integer, not float)
      const offsetInt = Math.floor(Number(offset)) || 0;
      const limitInt = Math.floor(Number(limit)) || 10;
      
      if (offsetInt < 0) {
        throw new GenericHttpException(
          'Offset must be a non-negative integer',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (limitInt < 1) {
        throw new GenericHttpException(
          'Limit must be a positive integer',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get total count of friend requests
      const countResult = await session.run(
        `MATCH (from:User)-[:FRIEND_REQUEST]->(to:User {userId: $userId})
             RETURN count(from) as total`,
        { userId },
      );
      const total = this.toNumber(countResult.records[0]?.get('total') || 0);

      // Get requester userIds from Neo4j
      const result = await session.run(
        `MATCH (from:User)-[:FRIEND_REQUEST]->(to:User {userId: $userId})
             RETURN from.userId as userId
             SKIP $offset
             LIMIT $limit`,
        { userId, offset: neo4j.int(offsetInt), limit: neo4j.int(limitInt) },
      );
      
      const requesterIds = result.records.map((r) => r.get('userId'));

      // Batch fetch profile details from PostgreSQL with all data
      const profiles = await this.prisma.profile.findMany({
        where: { userId: { in: requesterIds } },
        include: {
          user: true,
        },
      });

      // Create a map for quick lookup
      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      // Return full profile data, preserving order from Neo4j
      const requests = requesterIds
        .map((id) => profileMap.get(id))
        .filter((p): p is Profile & { user: User } => p !== undefined);

      // Calculate pagination metadata
      const hasMore = offsetInt + limitInt < total;
      const nextOffset = hasMore ? offsetInt + limitInt : null;

      return {
        data: requests,
        meta: {
          limit: limitInt,
          offset: offsetInt,
          total,
          hasMore,
          nextOffset,
        },
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      // Log the actual error for debugging
      console.error('Error in getFriendRequests:', error);
      throw new GenericHttpException(
        ERROR_MESSAGES.GET_FRIEND_REQUESTS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const session = this.neo4jservice.getSession();
    try {
      const result = await session.run(
        `MATCH (u1:User {userId: $userId1})-[:FRIENDS]-(u2:User {userId: $userId2})
             RETURN count(*) > 0 as areFriends`,
        { userId1, userId2 },
      );
      return result.records[0].get('areFriends');
    } finally {
      await session.close();
    }
  }

  async followUser(followerId: string, followeeId: string): Promise<void> {
    // Validate: Cannot follow yourself
    if (followerId === followeeId) {
      throw new GenericHttpException(
        ERROR_MESSAGES.CANNOT_FOLLOW_SELF,
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = this.neo4jservice.getSession();
    try {
      // Check if both users exist
      const followerExists = await this.userExists(followerId);
      const followeeExists = await this.userExists(followeeId);

      if (!followerExists || !followeeExists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
          HttpStatus.NOT_FOUND,
        );
      }

      await session.run(
        `MATCH (follower:User {userId: $followerId})
         MATCH (followee:User {userId: $followeeId})
         MERGE (follower)-[r:FOLLOWS]->(followee)
         SET r.createdAt = datetime()`,
        { followerId, followeeId },
      );
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        ERROR_MESSAGES.FOLLOW_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await this.notificationService.notifyNewFollower(followerId, followeeId);
      await session.close();
    }
  }

  async unfollowUser(followerId: string, followeeId: string): Promise<void> {
    const session = this.neo4jservice.getSession();
    try {
      // Check if both users exist
      const followerExists = await this.userExists(followerId);
      const followeeExists = await this.userExists(followeeId);

      if (!followerExists || !followeeExists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
          HttpStatus.NOT_FOUND,
        );
      }

      await session.run(
        `MATCH (follower:User {userId: $followerId})-[r:FOLLOWS]->(followee:User {userId: $followeeId})
         DELETE r`,
        { followerId, followeeId },
      );
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        ERROR_MESSAGES.UNFOLLOW_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  async getFollowers(
    userId: string,
    offset = 0,
    limit = 10,
  ): Promise<{
    data: (Profile & { user: User })[];
    meta: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
      nextOffset: number | null;
    };
  }> {
    const session = this.neo4jservice.getSession();
    try {
      // Check if user exists in Neo4j
      let userExists = await this.userExists(userId);

      // If user doesn't exist in Neo4j, try to create it from PostgreSQL
      if (!userExists) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            Profile: {
              select: {
                location: true,
                coverPhoto: true,
              },
            },
          },
        });

        if (user) {
          // Auto-create the node in Neo4j
          await this.createUserNode(user.id, {
            name: user.name,
            username: user.email,
            location: user.Profile?.location ?? null,
            coverPhoto: user.Profile?.coverPhoto ?? null,
          });
          userExists = true;
        } else {
          throw new GenericHttpException(
            ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      // Ensure offset and limit are integers (Neo4j requires integer, not float)
      const offsetInt = Math.floor(Number(offset)) || 0;
      const limitInt = Math.floor(Number(limit)) || 10;
      
      if (offsetInt < 0) {
        throw new GenericHttpException(
          'Offset must be a non-negative integer',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (limitInt < 1) {
        throw new GenericHttpException(
          'Limit must be a positive integer',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get total count of followers
      const countResult = await session.run(
        `MATCH (follower:User)-[:FOLLOWS]->(u:User {userId: $userId})
         RETURN count(follower) as total`,
        { userId },
      );
      const total = this.toNumber(countResult.records[0]?.get('total') || 0);

      // Get follower userIds from Neo4j
      const result = await session.run(
        `MATCH (follower:User)-[:FOLLOWS]->(u:User {userId: $userId})
         RETURN follower.userId as userId
         SKIP $offset
         LIMIT $limit`,
        { userId, offset: neo4j.int(offsetInt), limit: neo4j.int(limitInt) },
      );
      
      const followerIds = result.records.map((r) => r.get('userId'));

      // Batch fetch profile details from PostgreSQL with all data
      const profiles = await this.prisma.profile.findMany({
        where: { userId: { in: followerIds } },
        include: {
          user: true,
        },
      });

      // Create a map for quick lookup
      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      // Return full profile data, preserving order from Neo4j
      const followers = followerIds
        .map((id) => profileMap.get(id))
        .filter((p): p is Profile & { user: User } => p !== undefined);

      // Calculate pagination metadata
      const hasMore = offsetInt + limitInt < total;
      const nextOffset = hasMore ? offsetInt + limitInt : null;

      return {
        data: followers,
        meta: {
          limit: limitInt,
          offset: offsetInt,
          total,
          hasMore,
          nextOffset,
        },
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      console.error('Error in getFollowers:', error);
      throw new GenericHttpException(
        ERROR_MESSAGES.GET_FOLLOWERS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  async getFollowing(
    userId: string,
    offset = 0,
    limit = 10,
  ): Promise<{
    data: (Profile & { user: User })[];
    meta: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
      nextOffset: number | null;
    };
  }> {
    const session = this.neo4jservice.getSession();
    try {
      // Check if user exists in Neo4j
      let userExists = await this.userExists(userId);

      // If user doesn't exist in Neo4j, try to create it from PostgreSQL
      if (!userExists) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            Profile: {
              select: {
                location: true,
                coverPhoto: true,
              },
            },
          },
        });

        if (user) {
          // Auto-create the node in Neo4j
          await this.createUserNode(user.id, {
            name: user.name,
            username: user.email,
            location: user.Profile?.location ?? null,
            coverPhoto: user.Profile?.coverPhoto ?? null,
          });
          userExists = true;
        } else {
          throw new GenericHttpException(
            ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      // Ensure offset and limit are integers (Neo4j requires integer, not float)
      const offsetInt = Math.floor(Number(offset)) || 0;
      const limitInt = Math.floor(Number(limit)) || 10;
      
      if (offsetInt < 0) {
        throw new GenericHttpException(
          'Offset must be a non-negative integer',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (limitInt < 1) {
        throw new GenericHttpException(
          'Limit must be a positive integer',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get total count of following
      const countResult = await session.run(
        `MATCH (u:User {userId: $userId})-[:FOLLOWS]->(following:User)
         RETURN count(following) as total`,
        { userId },
      );
      const total = this.toNumber(countResult.records[0]?.get('total') || 0);

      // Get following userIds from Neo4j
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:FOLLOWS]->(following:User)
         RETURN following.userId as userId
         SKIP $offset
         LIMIT $limit`,
        { userId, offset: neo4j.int(offsetInt), limit: neo4j.int(limitInt) },
      );
      
      const followingIds = result.records.map((r) => r.get('userId'));

      // Batch fetch profile details from PostgreSQL with all data
      const profiles = await this.prisma.profile.findMany({
        where: { userId: { in: followingIds } },
        include: {
          user: true,
        },
      });

      // Create a map for quick lookup
      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      // Return full profile data, preserving order from Neo4j
      const following = followingIds
        .map((id) => profileMap.get(id))
        .filter((p): p is Profile & { user: User } => p !== undefined);

      // Calculate pagination metadata
      const hasMore = offsetInt + limitInt < total;
      const nextOffset = hasMore ? offsetInt + limitInt : null;

      return {
        data: following,
        meta: {
          limit: limitInt,
          offset: offsetInt,
          total,
          hasMore,
          nextOffset,
        },
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      console.error('Error in getFollowing:', error);
      throw new GenericHttpException(
        ERROR_MESSAGES.GET_FOLLOWING_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const session = this.neo4jservice.getSession();
    try {
      const result = await session.run(
        `MATCH (follower:User {userId: $followerId})-[:FOLLOWS]->(followee:User {userId: $followeeId})
         RETURN count(*) > 0 as isFollowing`,
        { followerId, followeeId },
      );
      return result.records[0].get('isFollowing');
    } finally {
      await session.close();
    }
  }

  async getFollowerCount(userId: string): Promise<number> {
    const session = this.neo4jservice.getSession();
    try {
      const result = await session.run(
        `MATCH (follower:User)-[:FOLLOWS]->(u:User {userId: $userId})
         RETURN count(follower) as count`,
        { userId },
      );
      return result.records[0].get('count').toNumber();
    } finally {
      await session.close();
    }
  }

  async getFollowingCount(userId: string): Promise<number> {
    const session = this.neo4jservice.getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:FOLLOWS]->(following:User)
         RETURN count(following) as count`,
        { userId },
      );
      return result.records[0].get('count').toNumber();
    } finally {
      await session.close();
    }
  }

  /**
   * Friend Recommendations based on:
   * 1. Mutual friends (friends of friends)
   * 2. Common followers
   * 3. Users you follow who follow them back
   * 4. Location matching
   */
  async getFriendRecommendations(
    userId: string,
    offset = 0,
    limit = 10,
  ): Promise<{
    data: (Profile & {
      user: User;
      score: number;
      mutualFriends: number;
      reason: string;
    })[];
    meta: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
      nextOffset: number | null;
    };
  }> {
    const session = this.neo4jservice.getSession();
    try {
      // Check if user exists in Neo4j
      let userExists = await this.userExists(userId);

      // If user doesn't exist in Neo4j, try to create it from PostgreSQL
      if (!userExists) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            Profile: {
              select: {
                location: true,
                coverPhoto: true,
              },
            },
          },
        });

        if (user) {
          // Auto-create the node in Neo4j
          await this.createUserNode(user.id, {
            name: user.name,
            username: user.email,
            location: user.Profile?.location ?? null,
            coverPhoto: user.Profile?.coverPhoto ?? null,
          });
          userExists = true;
        } else {
          throw new GenericHttpException(
            ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      // Ensure offset and limit are integers (Neo4j requires integer, not float)
      const offsetInt = Math.floor(Number(offset)) || 0;
      const limitInt = Math.floor(Number(limit)) || 10;
      
      if (offsetInt < 0) {
        throw new GenericHttpException(
          'Offset must be a non-negative integer',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (limitInt < 1) {
        throw new GenericHttpException(
          'Limit must be a positive integer',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get total count of recommendations (before pagination)
      const countResult = await session.run(
        `MATCH (u:User {userId: $userId})
         
         // Find friends of friends (not already friends)
        MATCH (u)-[:FRIENDS]->(friend)-[:FRIENDS]->(recommendation:User)
        WHERE recommendation.userId <> $userId
        AND NOT (u)-[:FRIENDS]-(recommendation)
        AND NOT (u)-[:FRIEND_REQUEST]->(recommendation)
        AND NOT (recommendation)-[:FRIEND_REQUEST]->(u)
         
         WITH DISTINCT recommendation
         RETURN count(recommendation) as total`,
        { userId },
      );
      const total = this.toNumber(countResult.records[0]?.get('total') || 0);

      // Get current user's location from PostgreSQL for location boost calculation
      const currentProfile = await this.prisma.profile.findUnique({
        where: { userId },
        select: {
          location: true,
        },
      });
      const userLocation = currentProfile?.location || null;

      const result = await session.run(
        `MATCH (u:User {userId: $userId})
         
         // Find friends of friends (not already friends)
        MATCH (u)-[:FRIENDS]->(friend)-[:FRIENDS]->(recommendation:User)
        WHERE recommendation.userId <> $userId
        AND NOT (u)-[:FRIENDS]-(recommendation)
        AND NOT (u)-[:FRIEND_REQUEST]->(recommendation)
        AND NOT (recommendation)-[:FRIEND_REQUEST]->(u)
         
         WITH recommendation, count(DISTINCT friend) as mutualFriends
         
         // Re-match user for optional follows check
         MATCH (u:User {userId: $userId})
         OPTIONAL MATCH (u)-[f1:FOLLOWS]->(recommendation)
         OPTIONAL MATCH (recommendation)-[f2:FOLLOWS]->(u)
         
         WITH recommendation, mutualFriends,
              CASE WHEN f1 IS NOT NULL THEN 2 ELSE 0 END +
              CASE WHEN f2 IS NOT NULL THEN 1 ELSE 0 END as followBoost
         
         WITH recommendation, mutualFriends, followBoost,
              (mutualFriends * 10 + followBoost) as score
         
         RETURN recommendation.userId as userId,
                mutualFriends,
                score,
                'mutual_friends' as reason
         ORDER BY score DESC
         SKIP $offset
         LIMIT $limit`,
        { userId, offset: neo4j.int(offsetInt), limit: neo4j.int(limitInt) },
      );

      const recommendationData = new Map<
        string,
        { mutualFriends: number; score: number; reason: string }
      >();
      const recommendedUserIds: string[] = [];

      result.records.forEach((r) => {
        const recUserId = r.get('userId');
        if (recUserId && !recommendationData.has(recUserId)) {
          recommendedUserIds.push(recUserId);
          recommendationData.set(recUserId, {
            mutualFriends: this.toNumber(r.get('mutualFriends')),
            score: this.toNumber(r.get('score')),
            reason: r.get('reason'),
          });
        }
      });

      const profiles = await this.prisma.profile.findMany({
        where: { userId: { in: recommendedUserIds } },
        include: {
          user: true,
        },
      });

      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      const recommendations = recommendedUserIds
        .map((id) => {
          const profile = profileMap.get(id);
          const neo4jData = recommendationData.get(id);
          if (!profile || !neo4jData) {
            return null;
          }

          const locationBoost =
            userLocation && profile.location && userLocation === profile.location ? 20 : 0;
          const finalScore = neo4jData.score + locationBoost;

          return {
            ...profile,
            score: finalScore,
            mutualFriends: neo4jData.mutualFriends,
            reason: neo4jData.reason,
          };
        })
        .filter(
          (
            r,
          ): r is Profile & {
            user: User;
            score: number;
            mutualFriends: number;
            reason: string;
          } => r !== null,
        )
        .sort((a, b) => b.score - a.score);

      const hasMore = offsetInt + limitInt < total;
      const nextOffset = hasMore ? offsetInt + limitInt : null;

      return {
        data: recommendations,
        meta: {
          limit: limitInt,
          offset: offsetInt,
          total,
          hasMore,
          nextOffset,
        },
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      console.error('Error in getFriendRecommendations:', error);
      throw new GenericHttpException(
        'Failed to get friend recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Follower Recommendations based on:
   * 1. Users followed by people you follow
   * 2. Popular users in your network
   * 3. Users who follow you back
   * 4. Location matching
   */
  async getFollowerRecommendations(
    userId: string,
    offset = 0,
    limit = 10,
  ): Promise<{
    data: (Profile & {
      user: User;
      score: number;
      mutualFriends: number;
      reason: string;
    })[];
    meta: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
      nextOffset: number | null;
    };
  }> {
    const session = this.neo4jservice.getSession();
    try {
      // Check if user exists in Neo4j
      let userExists = await this.userExists(userId);

      // If user doesn't exist in Neo4j, try to create it from PostgreSQL
      if (!userExists) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            Profile: {
              select: {
                location: true,
                coverPhoto: true,
              },
            },
          },
        });

        if (user) {
          // Auto-create the node in Neo4j
          await this.createUserNode(user.id, {
            name: user.name,
            username: user.email,
            location: user.Profile?.location ?? null,
            coverPhoto: user.Profile?.coverPhoto ?? null,
          });
          userExists = true;
        } else {
          throw new GenericHttpException(
            ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      // Ensure offset and limit are integers (Neo4j requires integer, not float)
      const offsetInt = Math.floor(Number(offset)) || 0;
      const limitInt = Math.floor(Number(limit)) || 10;
      
      if (offsetInt < 0) {
        throw new GenericHttpException(
          'Offset must be a non-negative integer',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (limitInt < 1) {
        throw new GenericHttpException(
          'Limit must be a positive integer',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get total count of recommendations (before pagination)
      const countResult = await session.run(
        `MATCH (u:User {userId: $userId})
         
         // Find users followed by people you follow
         MATCH (u)-[:FOLLOWS]->(following)-[:FOLLOWS]->(recommendation:User)
         WHERE recommendation.userId <> $userId
         AND NOT (u)-[:FOLLOWS]->(recommendation)
         
         WITH DISTINCT recommendation
         RETURN count(recommendation) as total`,
        { userId },
      );
      const total = this.toNumber(countResult.records[0]?.get('total') || 0);

      // Get current user's location from PostgreSQL for location boost calculation
      const currentProfile = await this.prisma.profile.findUnique({
        where: { userId },
        select: {
          location: true,
        },
      });
      const userLocation = currentProfile?.location || null;

      const result = await session.run(
        `MATCH (u:User {userId: $userId})
         
         // Find users followed by people you follow
         MATCH (u)-[:FOLLOWS]->(following)-[:FOLLOWS]->(recommendation:User)
         WHERE recommendation.userId <> $userId
         AND NOT (u)-[:FOLLOWS]->(recommendation)
         
         WITH recommendation, count(DISTINCT following) as commonFollowing
         
         // Re-match user for follow-back check
         MATCH (u:User {userId: $userId})
         
         // Count followers of the recommendation (popularity)
         OPTIONAL MATCH (recommendation)<-[:FOLLOWS]-(follower)
         WITH recommendation, commonFollowing, u, count(DISTINCT follower) as popularity
         
         // Check if they follow you back
         OPTIONAL MATCH (recommendation)-[fb:FOLLOWS]->(u)
         
         WITH recommendation, commonFollowing, popularity,
              CASE WHEN fb IS NOT NULL THEN 5 ELSE 0 END as followBackBonus
         
         WITH recommendation, commonFollowing, popularity, followBackBonus,
              (commonFollowing * 10 + (popularity / 10.0) + followBackBonus) as score
         
         RETURN recommendation.userId as userId,
                commonFollowing as mutualFriends,
                score,
                'common_following' as reason
         ORDER BY score DESC
         SKIP $offset
         LIMIT $limit`,
        { userId, offset: neo4j.int(offsetInt), limit: neo4j.int(limitInt) },
      );

      const recommendationData = new Map<
        string,
        { mutualFriends: number; score: number; reason: string }
      >();
      const recommendedUserIds: string[] = [];

      result.records.forEach((r) => {
        const recUserId = r.get('userId');
        if (recUserId && !recommendationData.has(recUserId)) {
          recommendedUserIds.push(recUserId);
          recommendationData.set(recUserId, {
            mutualFriends: this.toNumber(r.get('mutualFriends')),
            score: this.toNumber(r.get('score')),
            reason: r.get('reason'),
          });
        }
      });

      const profiles = await this.prisma.profile.findMany({
        where: { userId: { in: recommendedUserIds } },
        include: {
          user: true,
        },
      });

      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      const recommendations = recommendedUserIds
        .map((id) => {
          const profile = profileMap.get(id);
          const neo4jData = recommendationData.get(id);
          if (!profile || !neo4jData) {
            return null;
          }

          const locationBoost =
            userLocation && profile.location && userLocation === profile.location ? 20 : 0;
          const finalScore = neo4jData.score + locationBoost;

          return {
            ...profile,
            score: finalScore,
            mutualFriends: neo4jData.mutualFriends,
            reason: neo4jData.reason,
          };
        })
        .filter(
          (
            r,
          ): r is Profile & {
            user: User;
            score: number;
            mutualFriends: number;
            reason: string;
          } => r !== null,
        )
        .sort((a, b) => b.score - a.score);

      const hasMore = offsetInt + limitInt < total;
      const nextOffset = hasMore ? offsetInt + limitInt : null;

      return {
        data: recommendations,
        meta: {
          limit: limitInt,
          offset: offsetInt,
          total,
          hasMore,
          nextOffset,
        },
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      console.error('Error in getFollowerRecommendations:', error);
      throw new GenericHttpException(
        'Failed to get follower recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Get mutual friends between two users
   */
  async getMutualFriends(
    userId1: string,
    userId2: string,
    offset = 0,
    limit = 10,
  ): Promise<{
    data: (Profile & { user: User })[];
    meta: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
      nextOffset: number | null;
    };
  }> {
    const session = this.neo4jservice.getSession();
    try {
      // Check if both users exist
      const user1Exists = await this.userExists(userId1);
      const user2Exists = await this.userExists(userId2);

      if (!user1Exists || !user2Exists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
          HttpStatus.NOT_FOUND,
        );
      }

      // Ensure offset and limit are integers (Neo4j requires integer, not float)
      const offsetInt = Math.floor(Number(offset)) || 0;
      const limitInt = Math.floor(Number(limit)) || 10;
      
      if (offsetInt < 0) {
        throw new GenericHttpException(
          'Offset must be a non-negative integer',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (limitInt < 1) {
        throw new GenericHttpException(
          'Limit must be a positive integer',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get total count of mutual friends
      const countResult = await session.run(
        `MATCH (u1:User {userId: $userId1})-[:FRIENDS]->(mutual:User)<-[:FRIENDS]-(u2:User {userId: $userId2})
         RETURN count(mutual) as total`,
        { userId1, userId2 },
      );
      const total = this.toNumber(countResult.records[0]?.get('total') || 0);

      // Get mutual friend userIds from Neo4j
      const result = await session.run(
        `MATCH (u1:User {userId: $userId1})-[:FRIENDS]->(mutual:User)<-[:FRIENDS]-(u2:User {userId: $userId2})
         RETURN mutual.userId as userId
         SKIP $offset
         LIMIT $limit`,
        { userId1, userId2, offset: neo4j.int(offsetInt), limit: neo4j.int(limitInt) },
      );
      
      const mutualFriendIds = result.records.map((r) => r.get('userId'));

      // Batch fetch profile details from PostgreSQL with all data
      const profiles = await this.prisma.profile.findMany({
        where: { userId: { in: mutualFriendIds } },
        include: {
          user: true,
        },
      });

      // Create a map for quick lookup
      const profileMap = new Map(profiles.map((p) => [p.userId, p]));

      // Return full profile data, preserving order from Neo4j
      const mutualFriends = mutualFriendIds
        .map((id) => profileMap.get(id))
        .filter((p): p is Profile & { user: User } => p !== undefined);

      // Calculate pagination metadata
      const hasMore = offsetInt + limitInt < total;
      const nextOffset = hasMore ? offsetInt + limitInt : null;

      return {
        data: mutualFriends,
        meta: {
          limit: limitInt,
          offset: offsetInt,
          total,
          hasMore,
          nextOffset,
        },
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      console.error('Error in getMutualFriends:', error);
      throw new GenericHttpException(
        'Failed to get mutual friends',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Get network stats for a user
   */
  async getUserNetworkStats(userId: string) {
    const session = this.neo4jservice.getSession();
    try {
      // Check if user exists in Neo4j
      let userExists = await this.userExists(userId);

      // If user doesn't exist in Neo4j, try to create it from PostgreSQL
      if (!userExists) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            Profile: {
              select: {
                location: true,
                coverPhoto: true,
              },
            },
          },
        });

        if (user) {
          // Auto-create the node in Neo4j
          await this.createUserNode(user.id, {
            name: user.name,
            username: user.email,
            location: user.Profile?.location ?? null,
            coverPhoto: user.Profile?.coverPhoto ?? null,
          });
          userExists = true;
        } else {
          throw new GenericHttpException(
            ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      const result = await session.run(
        `MATCH (u:User {userId: $userId})
         OPTIONAL MATCH (u)-[:FRIENDS]-(friend)
         OPTIONAL MATCH (u)-[:FOLLOWS]->(following)
         OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower)
         RETURN count(DISTINCT friend) as friendsCount,
                count(DISTINCT following) as followingCount,
                count(DISTINCT follower) as followersCount`,
        { userId },
      );

      const record = result.records[0];
      return {
        friendsCount: record.get('friendsCount').toNumber(),
        followingCount: record.get('followingCount').toNumber(),
        followersCount: record.get('followersCount').toNumber(),
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      console.error('Error in getUserNetworkStats:', error);
      throw new GenericHttpException(
        'Failed to get network stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new GenericHttpException(
        'Cannot block yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = this.neo4jservice.getSession();
    try {
      const blockerExists = await this.userExists(blockerId);
      const blockedExists = await this.userExists(blockedId);

      if (!blockerExists || !blockedExists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
          HttpStatus.NOT_FOUND,
        );
      }

      // Remove friendship if exists
      await session.run(
        `MATCH (blocker:User {userId: $blockerId})-[r:FRIENDS]-(blocked:User {userId: $blockedId})
       DELETE r`,
        { blockerId, blockedId },
      );

      // Remove follow relationships
      await session.run(
        `MATCH (blocker:User {userId: $blockerId})-[r:FOLLOWS]-(blocked:User {userId: $blockedId})
       DELETE r`,
        { blockerId, blockedId },
      );

      // Remove friend requests
      await session.run(
        `MATCH (blocker:User {userId: $blockerId})-[r:FRIEND_REQUEST]-(blocked:User {userId: $blockedId})
       DELETE r`,
        { blockerId, blockedId },
      );

      // Create block relationship
      await session.run(
        `MATCH (blocker:User {userId: $blockerId})
       MATCH (blocked:User {userId: $blockedId})
       MERGE (blocker)-[r:BLOCKS]->(blocked)
       SET r.createdAt = datetime()`,
        { blockerId, blockedId },
      );
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        'Failed to block user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const session = this.neo4jservice.getSession();
    try {
      const result = await session.run(
        `MATCH (blocker:User {userId: $blockerId})-[r:BLOCKS]->(blocked:User {userId: $blockedId})
       DELETE r
       RETURN count(r) as deleted`,
        { blockerId, blockedId },
      );

      if (result.records[0].get('deleted').toNumber() === 0) {
        throw new GenericHttpException(
          'User is not blocked',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        'Failed to unblock user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Check if user is blocked
   */
  async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const session = this.neo4jservice.getSession();
    try {
      const result = await session.run(
        `MATCH (u1:User {userId: $userId})-[:BLOCKS]->(u2:User {userId: $targetUserId})
       RETURN count(*) > 0 as isBlocked`,
        { userId, targetUserId },
      );
      return result.records[0].get('isBlocked');
    } finally {
      await session.close();
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string, limit = 100): Promise<UserNode[]> {
    const session = this.neo4jservice.getSession();
    try {
      const userExists = await this.userExists(userId);
      if (!userExists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
          HttpStatus.NOT_FOUND,
        );
      }

      const limitInt = Math.floor(Number(limit)) || 100;
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:BLOCKS]->(blocked:User)
       RETURN blocked.userId as userId, blocked.username as username, blocked.name as name
       LIMIT $limit`,
        { userId, limit: neo4j.int(limitInt) },
      );

      return result.records.map((r) => ({
        userId: r.get('userId'),
        username: r.get('username'),
        name: r.get('name'),
      }));
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        'Failed to get blocked users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Mute a user
   */
  async muteUser(muterId: string, mutedId: string): Promise<void> {
    if (muterId === mutedId) {
      throw new GenericHttpException(
        'Cannot mute yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = this.neo4jservice.getSession();
    try {
      const muterExists = await this.userExists(muterId);
      const mutedExists = await this.userExists(mutedId);

      if (!muterExists || !mutedExists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
          HttpStatus.NOT_FOUND,
        );
      }

      await session.run(
        `MATCH (muter:User {userId: $muterId})
       MATCH (muted:User {userId: $mutedId})
       MERGE (muter)-[r:MUTES]->(muted)
       SET r.createdAt = datetime()`,
        { muterId, mutedId },
      );
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        'Failed to mute user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Unmute a user
   */
  async unmuteUser(muterId: string, mutedId: string): Promise<void> {
    const session = this.neo4jservice.getSession();
    try {
      const result = await session.run(
        `MATCH (muter:User {userId: $muterId})-[r:MUTES]->(muted:User {userId: $mutedId})
       DELETE r
       RETURN count(r) as deleted`,
        { muterId, mutedId },
      );

      if (result.records[0].get('deleted').toNumber() === 0) {
        throw new GenericHttpException(
          'User is not muted',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        'Failed to unmute user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Check if user is muted
   */
  async isMuted(userId: string, targetUserId: string): Promise<boolean> {
    const session = this.neo4jservice.getSession();
    try {
      const result = await session.run(
        `MATCH (u1:User {userId: $userId})-[:MUTES]->(u2:User {userId: $targetUserId})
       RETURN count(*) > 0 as isMuted`,
        { userId, targetUserId },
      );
      return result.records[0].get('isMuted');
    } finally {
      await session.close();
    }
  }

  /**
   * Get muted users
   */
  async getMutedUsers(userId: string, limit = 100): Promise<UserNode[]> {
    const session = this.neo4jservice.getSession();
    try {
      const userExists = await this.userExists(userId);
      if (!userExists) {
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
          HttpStatus.NOT_FOUND,
        );
      }

      const limitInt = Math.floor(Number(limit)) || 100;
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:MUTES]->(muted:User)
       RETURN muted.userId as userId, muted.username as username, muted.name as name
       LIMIT $limit`,
        { userId, limit: neo4j.int(limitInt) },
      );

      return result.records.map((r) => ({
        userId: r.get('userId'),
        username: r.get('username'),
        name: r.get('name'),
      }));
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        'Failed to get muted users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.close();
    }
  }
}
