import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CloudinaryModule } from '../../common/services/cloudinary/cloudinary.module';
import { NotificationModule } from '../notification/notification.module';
import { HelperModule } from 'src/common/utils/helper/helper.module';

@Module({
  imports: [CloudinaryModule, NotificationModule, HelperModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
