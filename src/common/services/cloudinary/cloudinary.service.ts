import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';
import { PROFILE_CONSTANTS } from '../../constants/profile.constants';
import { PROFILE_ERROR_MESSAGES } from '../../constants/profile-error-messages.constant';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadProfilePicture(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    // Validate file type
    if (!PROFILE_CONSTANTS.UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(PROFILE_ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    // Validate file size
    if (file.size > PROFILE_CONSTANTS.UPLOAD.MAX_PROFILE_PICTURE_SIZE) {
      throw new BadRequestException(PROFILE_ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    try {
      const result = await this.uploadStream(file, {
        folder: 'profiles/pictures',
        public_id: `profile_${userId}_${Date.now()}`,
        transformation: [
          {
            width: PROFILE_CONSTANTS.UPLOAD.PROFILE_PICTURE_DIMENSIONS.WIDTH,
            height: PROFILE_CONSTANTS.UPLOAD.PROFILE_PICTURE_DIMENSIONS.HEIGHT,
            crop: 'fill',
            gravity: 'face',
          },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new BadRequestException(PROFILE_ERROR_MESSAGES.UPLOAD_FAILED);
    }
  }

  async uploadCoverPhoto(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    // Validate file type
    if (!PROFILE_CONSTANTS.UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(PROFILE_ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    // Validate file size
    if (file.size > PROFILE_CONSTANTS.UPLOAD.MAX_COVER_PHOTO_SIZE) {
      throw new BadRequestException(PROFILE_ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    try {
      const result = await this.uploadStream(file, {
        folder: 'profiles/covers',
        public_id: `cover_${userId}_${Date.now()}`,
        transformation: [
          {
            width: PROFILE_CONSTANTS.UPLOAD.COVER_PHOTO_DIMENSIONS.WIDTH,
            height: PROFILE_CONSTANTS.UPLOAD.COVER_PHOTO_DIMENSIONS.HEIGHT,
            crop: 'fill',
            gravity: 'center',
          },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new BadRequestException(PROFILE_ERROR_MESSAGES.UPLOAD_FAILED);
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      // Don't throw error for delete failures
    }
  }

  private uploadStream(
    file: Express.Multer.File,
    options: any,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }

  extractPublicId(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }
}