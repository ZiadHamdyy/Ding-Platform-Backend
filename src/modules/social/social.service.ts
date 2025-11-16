import { Injectable, HttpStatus } from '@nestjs/common';
import { Neo4jService } from 'src/configs/neo4j/neo4j.service';
import { DatabaseService } from 'src/configs/database/database.service';
import { UserNode } from 'src/common/interfaces/user.interface';
import { GenericHttpException } from 'src/common/application/exceptions/generic-http-exception';
import { ERROR_MESSAGES } from 'src/common/constants/error-messages.constant';
import neo4j from 'neo4j-driver';

@Injectable()
export class SocialService {
  constructor(
    private readonly neo4jservice: Neo4jService,
    private readonly prisma: DatabaseService,
  ) {}

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
    name: string | undefined,
    username: string,
    location: string | undefined,
    coverPhoto: string | undefined,
  ): Promise<void> {
    const session = this.neo4jservice.getSession();
    try {
      await session.run(
        `MERGE (u:User {userId: $userId})
             SET u.id = $userId, u.name = $name, u.username = $username, u.location = $location, u.coverPhoto = $coverPhoto, u.updatedAt = datetime()`,
        { 
          userId, 
          name: name ?? null, 
          username, 
          location: location ?? null, 
          coverPhoto: coverPhoto ?? null,
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

  async toggleSendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
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
      const requestExists = await this.friendRequestExists(fromUserId, toUserId);
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
      const requestExists = await this.friendRequestExists(fromUserId, toUserId);
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

  async getFriends(userId: string, limit = 100): Promise<UserNode[]> {
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
          await this.createUserNode(
            user.id,
            user.name || undefined,
            user.email,
            user.Profile?.location || undefined,
            user.Profile?.coverPhoto || undefined,
          );
          userExists = true;
        } else {
          throw new GenericHttpException(
            ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      // Ensure limit is an integer (Neo4j requires integer, not float)
      const limitInt = Math.floor(Number(limit)) || 100;
      if (limitInt < 0) {
        throw new GenericHttpException(
          'Limit must be a non-negative integer',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Use Neo4j's integer type to ensure it's sent as an integer, not a float
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:FRIENDS]->(friend:User)
             RETURN friend.userId as userId, friend.username as username, friend.name as name
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

  async getFriendRequests(userId: string): Promise<UserNode[]> {
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
          await this.createUserNode(
            user.id,
            user.name || undefined,
            user.email,
            user.Profile?.location || undefined,
            user.Profile?.coverPhoto || undefined,
          );
          userExists = true;
        } else {
          throw new GenericHttpException(
            ERROR_MESSAGES.USER_NOT_FOUND_IN_SOCIAL,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      const result = await session.run(
        `MATCH (from:User)-[:FRIEND_REQUEST]->(to:User {userId: $userId})
             RETURN from.userId as userId, from.username as username, from.name as name`,
        { userId },
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
}
