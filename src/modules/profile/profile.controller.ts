import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { FileCleanupInterceptor } from '../../common/interceptors/file-cleanup.interceptor';
import type { currentUserType } from '../../common/types/current-user.type';
import { UpdateProfileRequest } from './dtos/request/update-profile.request';
import { UpdatePrivacyRequest } from './dtos/request/update-privacy.request';
import { SearchProfileRequest } from './dtos/request/search-profile.request';
import { ProfileResponse } from './dtos/response/profile.response';
import { UploadResponse } from './dtos/response/upload.response';
import { SearchProfileResponse } from './dtos/response/search-profile.response';
import { PROFILE_CONSTANTS } from '../../common/constants/profile.constants';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @Serialize(SearchProfileResponse)
  @ApiOperation({ summary: 'Search public profiles (no auth required)' })
  async searchProfiles(@Query() filters: SearchProfileRequest) {
    return await this.profileService.searchProfiles(filters);
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @Serialize(ProfileResponse)
  @ApiOperation({
    summary: 'Get user profile by ID (public profiles accessible without auth)',
  })
  async getProfile(
    @Param('userId') userId: string,
    @currentUser() user?: currentUserType,
  ) {
    return await this.profileService.getProfile(userId, user?.id);
  }

  @Put()
  @UseGuards(JwtAuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  @Serialize(ProfileResponse)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create or update own profile (requires authentication)',
  })
  async updateProfile(
    @currentUser() user: currentUserType,
    @Body() data: UpdateProfileRequest,
  ) {
    return await this.profileService.createOrUpdateProfile(user.id, data);
  }

  @Patch('picture')
  @UseGuards(JwtAuthenticationGuard)
  @UseInterceptors(FileInterceptor('file'), FileCleanupInterceptor)
  @HttpCode(HttpStatus.OK)
  @Serialize(UploadResponse)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload profile picture (requires authentication)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadProfilePicture(
    @currentUser() user: currentUserType,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: PROFILE_CONSTANTS.UPLOAD.MAX_PROFILE_PICTURE_SIZE,
            message: `File size must not exceed ${PROFILE_CONSTANTS.UPLOAD.MAX_PROFILE_PICTURE_SIZE / 1024 / 1024}MB`,
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.profileService.uploadProfilePicture(user.id, file);
  }

  @Patch('cover')
  @UseGuards(JwtAuthenticationGuard)
  @UseInterceptors(FileInterceptor('file'), FileCleanupInterceptor)
  @HttpCode(HttpStatus.OK)
  @Serialize(UploadResponse)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload cover photo (requires authentication)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadCoverPhoto(
    @currentUser() user: currentUserType,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: PROFILE_CONSTANTS.UPLOAD.MAX_COVER_PHOTO_SIZE,
            message: `File size must not exceed ${PROFILE_CONSTANTS.UPLOAD.MAX_COVER_PHOTO_SIZE / 1024 / 1024}MB`,
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.profileService.uploadCoverPhoto(user.id, file);
  }

  @Patch('privacy')
  @UseGuards(JwtAuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  @Serialize(ProfileResponse)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update privacy settings (requires authentication)',
  })
  async updatePrivacySettings(
    @currentUser() user: currentUserType,
    @Body() data: UpdatePrivacyRequest,
  ) {
    return await this.profileService.updatePrivacySettings(user.id, data);
  }

  @Delete()
  @UseGuards(JwtAuthenticationGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete own profile (requires authentication)' })
  async deleteProfile(@currentUser() user: currentUserType) {
    return await this.profileService.deleteProfile(user.id);
  }
}
