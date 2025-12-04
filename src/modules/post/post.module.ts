import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CloudinaryModule } from '../../common/services/cloudinary/cloudinary.module';
import { NotificationModule } from '../notification/notification.module';
import { HelperModule } from '../../common/utils/helper/helper.module';

@Module({
  imports: [
    CloudinaryModule,
    NotificationModule,
    HelperModule,
    BullModule.registerQueue({
      name: 'graph-sync',
    }),
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
