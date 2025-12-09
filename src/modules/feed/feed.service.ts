import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { Neo4jService } from '../../configs/neo4j/neo4j.service';
import { FeedItemDto } from './dtos/response/feed.response';
import { PaginationDto, PaginatedResponse } from '../../common/dtos/pagination.dto';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly neo4jService: Neo4jService,
  ) {}

  async getFeed(userId: string, page = 1, limit = 20): Promise<PaginatedResponse<FeedItemDto>> {
    // Personalized feed backed by Neo4j; falls back to chronological feed.
    const scoredPostIds = await this.getScoredPostsFromGraph(userId, limit * 2);

    if (!scoredPostIds.length) {
      return this.getChronologicalFeed(userId, page, limit);
    }

    const posts = await this.prisma.post.findMany({
      where: {
        id: { in: scoredPostIds.map((p) => p.postId) },
        isDeleted: false,
      },
      include: {
        author: true,
        _count: {
          select: {
            Likes: true,
            Comments: true,
          },
        },
      },
    });

    const scoreMap = new Map(scoredPostIds.map((s) => [s.postId, s.score as number]));

    const items = posts.map((p) => ({
      id: p.id,
      author: p.author?.name ?? '',
      time: p.createdAt.toISOString(),
      content: p.content,
      likes: p._count?.Likes ?? 0,
      comments: p._count?.Comments ?? 0,
      image: p.mediaUrls?.[0] ?? null,
      score: scoreMap.get(p.id),
    }));

    items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    const start = (page - 1) * limit;
    const paginated = items.slice(start, start + limit);
    const data: FeedItemDto[] = paginated.map(({ score, ...rest }) => rest);

    return {
      data,
      total: items.length,
      page,
      limit,
      totalPages: Math.ceil(items.length / limit),
    };
  }

  /**
   * Legacy chronological feed used as a fallback when Neo4j
   * does not yet have enough interaction data.
   */
  private async getChronologicalFeed(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<FeedItemDto>> {
    const skip = (page - 1) * limit;
    // Determine user ids to include: public posts + posts from followed users + friends (if needed)
    const session = this.neo4jService.getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:FOLLOWS]->(followed:User)
         WITH collect(followed.id) as followingIds
         RETURN followingIds`,
        { userId },
      );

      const rawFollowing = result.records[0]?.get('followingIds');
      const followingIds =
        rawFollowing && typeof (rawFollowing as any).toArray === 'function'
          ? // Neo4j List
            (rawFollowing as any).toArray()
          : Array.isArray(rawFollowing)
            ? // Already a plain JS array
              rawFollowing
            : rawFollowing != null
              ? // Single value
                [rawFollowing]
              : [];
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
        include: {
          author: true,
          _count: {
            select: {
              Likes: true,
              Comments: true,
            },
          },
        },
      });
      const data: FeedItemDto[] = posts.map((p) => ({
        id: p.id,
        author: p.author?.name ?? '',
        time: p.createdAt.toISOString(),
        content: p.content,
        likes: p._count?.Likes ?? 0,
        comments: p._count?.Comments ?? 0,
        image: p.mediaUrls?.[0] ?? null,
      }));
      const total = await this.prisma.post.count({
        where: {
          OR: [
            { privacy: 'PUBLIC' },
            { authorId: { in: authorIds } },
          ],
        },
      });
      const totalPages = Math.ceil(total / limit);
      return { data, total, page, limit, totalPages };
    } finally {
      await session.close();
    }
  }

  /**
   * Neo4j scoring query that returns candidate posts with scores
   * based on engagement, affinity, and recency.
   */
  private async getScoredPostsFromGraph(userId: string, limit: number) {
    // Ensure Neo4j LIMIT always receives a non-negative integer value
    const safeLimit = Math.max(0, Math.floor(limit));
    const session = this.neo4jService.getSession();

    try {
      const result = await session.run(
        `
        MATCH (user:User {id: $userId})-[:FOLLOWS]->(author:User)
        MATCH (author)-[:POSTED]->(post:Post)
        WHERE post.createdAt > datetime() - duration('P7D')

        OPTIONAL MATCH (user)-[userInteraction:LIKED|COMMENTED]->(post)
        OPTIONAL MATCH (post)<-[allEngagement:LIKED|COMMENTED]-()
        OPTIONAL MATCH (user)-[affinity:INTERACTED_WITH]->(author)

        WITH post, author, 
             COUNT(DISTINCT allEngagement) as totalEngagement,
             affinity.score as affinityScore,
             CASE WHEN userInteraction IS NULL THEN 0 ELSE 1 END as alreadyInteracted,
             duration.between(post.createdAt, datetime()).minutes as ageMinutes

        WHERE alreadyInteracted = 0

        WITH post,
             totalEngagement * 1.0 as engagementScore,
             COALESCE(affinityScore, 0) * 2.0 as affinityWeight,
             1.0 / (1.0 + ageMinutes / 60.0) as timeDecay

        WITH post,
             (engagementScore + affinityWeight) * timeDecay as finalScore

        RETURN post.id as postId, finalScore as score
        ORDER BY finalScore DESC
        LIMIT toInteger($limit)
        `,
        { userId, limit: safeLimit },
      );

      return result.records.map((record) => ({
        postId: record.get('postId') as string,
        score: record.get('score') as number,
      }));
    } finally {
      await session.close();
    }
  }
}
