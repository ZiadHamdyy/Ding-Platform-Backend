import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class MigrationService {
  constructor(
    private readonly prisma: DatabaseService,
    @InjectQueue('graph-sync') private readonly graphQueue: Queue,
  ) {}

  async syncAllPostsToNeo4j() {
    const batchSize = 1000;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const posts = await this.prisma.post.findMany({
        select: {
          id: true,
          authorId: true,
          createdAt: true,
          isDeleted: true,
        },
        skip,
        take: batchSize,
      });

      if (posts.length === 0) {
        hasMore = false;
        break;
      }

      const activePosts = posts.filter((p) => !p.isDeleted);

      if (activePosts.length > 0) {
        await this.graphQueue.add('batch-sync-posts', {
          posts: activePosts.map((p) => ({
            id: p.id,
            authorId: p.authorId,
            createdAt: p.createdAt.toISOString(),
          })),
        });
      }

      skip += batchSize;
      console.log(`Queued ${skip} posts for Neo4j sync`);
    }

    console.log('✓ All posts queued for sync');
  }
}


