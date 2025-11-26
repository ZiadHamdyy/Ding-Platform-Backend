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
    if (!PROFILE_CONSTANTS.UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype as typeof PROFILE_CONSTANTS.UPLOAD.ALLOWED_IMAGE_TYPES[number])) {
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
    if (!PROFILE_CONSTANTS.UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype as typeof PROFILE_CONSTANTS.UPLOAD.ALLOWED_IMAGE_TYPES[number])) {
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

  async uploadPostImage(
    file: Express.Multer.File,
    postId: string,
  ): Promise<{ url: string; publicId: string; width: number; height: number }> {
    const POST_CONSTANTS = await import('../../constants/post.constants').then(
      (m) => m.POST_CONSTANTS,
    );
    const ERROR_MESSAGES = await import(
      '../../constants/error-messages.constant'
    ).then((m) => m.ERROR_MESSAGES);

    // Validate file type
    if (
      !POST_CONSTANTS.UPLOAD.ALLOWED_IMAGE_TYPES.includes(
        file.mimetype as (typeof POST_CONSTANTS.UPLOAD.ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      throw new BadRequestException(ERROR_MESSAGES.POST_INVALID_IMAGE_TYPE);
    }

    // Validate file size
    if (file.size > POST_CONSTANTS.VALIDATION.MAX_IMAGE_SIZE) {
      throw new BadRequestException(ERROR_MESSAGES.POST_IMAGE_TOO_LARGE);
    }

    try {
      const result = await this.uploadStream(file, {
        folder: `${POST_CONSTANTS.CLOUDINARY.FOLDER}/images`,
        public_id: `post_${postId}_${Date.now()}`,
        transformation: [
          {
            width: POST_CONSTANTS.CLOUDINARY.IMAGE_TRANSFORMATION.MAX_WIDTH,
            height: POST_CONSTANTS.CLOUDINARY.IMAGE_TRANSFORMATION.MAX_HEIGHT,
            crop: 'limit',
          },
          {
            quality: POST_CONSTANTS.CLOUDINARY.IMAGE_TRANSFORMATION.QUALITY,
            fetch_format: POST_CONSTANTS.CLOUDINARY.IMAGE_TRANSFORMATION.FORMAT,
          },
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Cloudinary post image upload error:', error);
      throw new BadRequestException(ERROR_MESSAGES.POST_MEDIA_UPLOAD_FAILED);
    }
  }

  async uploadPostVideo(
    file: Express.Multer.File,
    postId: string,
  ): Promise<{ url: string; publicId: string; width: number; height: number }> {
    const POST_CONSTANTS = await import('../../constants/post.constants').then(
      (m) => m.POST_CONSTANTS,
    );
    const ERROR_MESSAGES = await import(
      '../../constants/error-messages.constant'
    ).then((m) => m.ERROR_MESSAGES);

    // Validate file type
    if (
      !POST_CONSTANTS.UPLOAD.ALLOWED_VIDEO_TYPES.includes(
        file.mimetype as (typeof POST_CONSTANTS.UPLOAD.ALLOWED_VIDEO_TYPES)[number],
      )
    ) {
      throw new BadRequestException(ERROR_MESSAGES.POST_INVALID_VIDEO_TYPE);
    }

    // Validate file size
    if (file.size > POST_CONSTANTS.VALIDATION.MAX_VIDEO_SIZE) {
      throw new BadRequestException(ERROR_MESSAGES.POST_VIDEO_TOO_LARGE);
    }

    try {
      const result = await this.uploadStream(file, {
        folder: `${POST_CONSTANTS.CLOUDINARY.FOLDER}/videos`,
        public_id: `post_video_${postId}_${Date.now()}`,
        resource_type: 'video',
        transformation: [
          {
            width: POST_CONSTANTS.CLOUDINARY.VIDEO_TRANSFORMATION.MAX_WIDTH,
            height: POST_CONSTANTS.CLOUDINARY.VIDEO_TRANSFORMATION.MAX_HEIGHT,
            crop: 'limit',
          },
          {
            quality: POST_CONSTANTS.CLOUDINARY.VIDEO_TRANSFORMATION.QUALITY,
          },
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width || 0,
        height: result.height || 0,
      };
    } catch (error) {
      console.error('Cloudinary post video upload error:', error);
      throw new BadRequestException(ERROR_MESSAGES.POST_MEDIA_UPLOAD_FAILED);
    }
  }

  async uploadMultiplePostMedia(
    files: { images?: Express.Multer.File[]; videos?: Express.Multer.File[] },
    postId: string,
  ): Promise<{
    imageUrls: Array<{
      url: string;
      publicId: string;
      width: number;
      height: number;
    }>;
    videoUrls: Array<{
      url: string;
      publicId: string;
      width: number;
      height: number;
    }>;
  }> {
    const imageUrls: Array<{
      url: string;
      publicId: string;
      width: number;
      height: number;
    }> = [];
    const videoUrls: Array<{
      url: string;
      publicId: string;
      width: number;
      height: number;
    }> = [];

    // Upload images
    if (files.images && files.images.length > 0) {
      for (const image of files.images) {
        const result = await this.uploadPostImage(image, postId);
        imageUrls.push(result);
      }
    }

    // Upload videos
    if (files.videos && files.videos.length > 0) {
      for (const video of files.videos) {
        const result = await this.uploadPostVideo(video, postId);
        videoUrls.push(result);
      }
    }

    return { imageUrls, videoUrls };
  }
}