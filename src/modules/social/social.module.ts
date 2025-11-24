import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../configs/database/database.module';
import { NotificationModule } from '../notification/notification.module';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';

@Module({
  imports: [DatabaseModule, NotificationModule],
  providers: [SocialService],
  controllers: [SocialController],
  exports: [SocialService],
})
export class SocialModule {}
