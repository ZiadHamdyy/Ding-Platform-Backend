import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { DatabaseModule } from '../../configs/database/database.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    DatabaseModule,
    NotificationModule,
    BullModule.registerQueue({
      name: 'graph-sync',
    }),
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
