import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { Neo4jService } from '../../configs/neo4j/neo4j.service';
import { FeedItemDto, PaginationDto } from './dtos/response/feed.response';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly neo4jService: Neo4jService,
  ) {}

  /**
   * Retrieve feed posts for a user with pagination and privacy filtering.
   * This is a simplified implementation that fetches public posts and posts from users the requester follows.
   */
  async getFeed(userId: string, page = 1, limit = 20): Promise<{ data: FeedItemDto[]; meta: PaginationDto }> {
    const skip = (page - 1) * limit;
    // Determine user ids to include: public posts + posts from followed users + friends (if needed)
    const session = this.neo4jService.getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {userId: $userId})-[:FOLLOWS]->(followed:User)
         WITH collect(followed.userId) as followingIds
         RETURN followingIds`,
        { userId },
      );
      const followingIds = result.records[0]?.get('followingIds')?.values?.map((v: any) => v) || [];
      const authorIds = [userId, ...followingIds];
      const posts = await this.prisma.post.findMany({
        where: {
          OR: [
            { privacy: 'PUBLIC' },
            { authorId: { in: authorIds } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { author: true },
      });
      const data: FeedItemDto[] = posts.map((p) => ({
        id: p.id,
        content: p.content,
        authorId: p.authorId,
        authorName: p.author?.name ?? undefined,
        createdAt: p.createdAt,
        mediaUrls: p.mediaUrls,
        privacy: p.privacy,
      }));
      return { data, meta: { page, limit, total: data.length } };
    } finally {
      await session.close();
    }
  }
}
