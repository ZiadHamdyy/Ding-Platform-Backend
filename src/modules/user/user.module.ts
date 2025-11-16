import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HelperModule } from '../../common/utils/helper/helper.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [HelperModule, SocialModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
