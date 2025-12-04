import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'graph-sync',
    }),
  ],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
