import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GraphSyncProcessor } from './graph-sync.processor';
import { Neo4jModule } from '../../configs/neo4j/neo4j.module';
import { MigrationService } from './migration.service';
import { DatabaseModule } from '../../configs/database/database.module';

@Module({
  imports: [
    Neo4jModule,
    DatabaseModule,
    BullModule.registerQueue({
      name: 'graph-sync',
    }),
  ],
  providers: [GraphSyncProcessor, MigrationService],
  exports: [MigrationService],
})
export class GraphSyncModule {}



