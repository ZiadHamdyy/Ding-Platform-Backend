import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Neo4jService } from '../../configs/neo4j/neo4j.service';

@Processor('graph-sync')
export class GraphSyncProcessor {
  constructor(private readonly neo4j: Neo4jService) {}

  @Process('sync-post')
  async handlePostSync(job: Job) {
    const { postId, authorId, createdAt, action, updatedAt } = job.data;
    const session = this.neo4j.getSession();

    try {
      if (action === 'CREATE') {
        await session.run(
          `
          MERGE (post:Post {id: $postId})
          SET post.createdAt = datetime($createdAt)

          WITH post
          MATCH (author:User {id: $authorId})
          MERGE (author)-[:POSTED]->(post)
        `,
          {
            postId,
            authorId,
            createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
          },
        );
        console.log(`✓ Created post ${postId} in Neo4j`);
      } else if (action === 'UPDATE') {
        await session.run(
          `
          MATCH (post:Post {id: $postId})
          SET post.updatedAt = datetime($updatedAt)
        `,
          {
            postId,
            updatedAt: (updatedAt ? new Date(updatedAt) : new Date()).toISOString(),
          },
        );
        console.log(`✓ Updated post ${postId} in Neo4j`);
      } else if (action === 'DELETE') {
        await session.run(
          `
          MATCH (post:Post {id: $postId})
          DETACH DELETE post
        `,
          { postId },
        );
        console.log(`✓ Deleted post ${postId} from Neo4j`);
      }
    } catch (error) {
      console.error('Neo4j post sync failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  @Process('sync-like')
  async handleLikeSync(job: Job) {
    const { userId, postId, action, timestamp } = job.data;
    const session = this.neo4j.getSession();

    try {
      if (action === 'LIKE') {
        await session.run(
          `
          MATCH (user:User {id: $userId})
          MATCH (post:Post {id: $postId})
          MERGE (user)-[like:LIKED]->(post)
          SET like.timestamp = datetime($timestamp)

          WITH user, post
          MATCH (post)<-[:POSTED]-(author:User)
          MERGE (user)-[affinity:INTERACTED_WITH]->(author)
          SET affinity.score = COALESCE(affinity.score, 0) + 1,
              affinity.lastInteraction = datetime($timestamp)
        `,
          {
            userId,
            postId,
            timestamp: (timestamp ? new Date(timestamp) : new Date()).toISOString(),
          },
        );
      } else if (action === 'UNLIKE') {
        await session.run(
          `
          MATCH (user:User {id: $userId})-[like:LIKED]->(post:Post {id: $postId})
          DELETE like
        `,
          { userId, postId },
        );
      }
      console.log(`✓ Synced ${action} for user ${userId} on post ${postId}`);
    } catch (error) {
      console.error('Neo4j like sync failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  @Process('sync-comment')
  async handleCommentSync(job: Job) {
    const { userId, postId, commentId, timestamp, action } = job.data;
    const session = this.neo4j.getSession();

    try {
      if (action === 'DELETE') {
        await session.run(
          `
          MATCH (user:User {id: $userId})-[commented:COMMENTED]->(post:Post {id: $postId})
          WHERE commented.commentId = $commentId
          DELETE commented
        `,
          { userId, postId, commentId },
        );
        console.log(`✓ Synced comment deletion for user ${userId} on post ${postId}`);
      } else {
        await session.run(
          `
          MATCH (user:User {id: $userId})
          MATCH (post:Post {id: $postId})
          MERGE (user)-[commented:COMMENTED]->(post)
          SET commented.timestamp = datetime($timestamp),
              commented.commentId = $commentId

          WITH user, post
          MATCH (post)<-[:POSTED]-(author:User)
          MERGE (user)-[affinity:INTERACTED_WITH]->(author)
          SET affinity.score = COALESCE(affinity.score, 0) + 3,
              affinity.lastInteraction = datetime($timestamp)
        `,
          {
            userId,
            postId,
            commentId,
            timestamp: (timestamp ? new Date(timestamp) : new Date()).toISOString(),
          },
        );
        console.log(`✓ Synced comment for user ${userId} on post ${postId}`);
      }
    } catch (error) {
      console.error('Neo4j comment sync failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  @Process('batch-sync-posts')
  async handleBatchSync(job: Job) {
    const { posts } = job.data as {
      posts: { id: string; authorId: string; createdAt: string }[];
    };
    const session = this.neo4j.getSession();

    try {
      await session.run(
        `
        UNWIND $posts as postData
        MERGE (post:Post {id: postData.id})
        SET post.createdAt = datetime(postData.createdAt)

        WITH post, postData
        MATCH (author:User {id: postData.authorId})
        MERGE (author)-[:POSTED]->(post)
      `,
        { posts },
      );
      console.log(`✓ Batch synced ${posts.length} posts`);
    } catch (error) {
      console.error('Batch sync failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}


