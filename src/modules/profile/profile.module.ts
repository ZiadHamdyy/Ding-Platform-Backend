import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { CloudinaryModule } from '../../common/services/cloudinary/cloudinary.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [CloudinaryModule, SocialModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
