import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../configs/database/database.module';
import { Neo4jModule } from '../../configs/neo4j/neo4j.module';
import { SocialModule } from '../social/social.module';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';

@Module({
  imports: [DatabaseModule, Neo4jModule, SocialModule],
  providers: [FeedService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
