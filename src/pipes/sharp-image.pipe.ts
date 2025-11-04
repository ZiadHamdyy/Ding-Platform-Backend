import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

export interface SharpOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

@Injectable()
export class SharpImagePipe implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>> {
  constructor(private options: SharpOptions = {}) {}

  async transform(file: Express.Multer.File): Promise<Express.Multer.File> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const { width = 800, height = 800, fit = 'cover', format = 'jpeg', quality = 80 } = this.options;

      const processedBuffer = await sharp(file.buffer)
        .resize(width, height, { fit })
        .toFormat(format, { quality })
        .toBuffer();

      return {
        ...file,
        buffer: processedBuffer,
        size: processedBuffer.length,
        mimetype: `image/${format}`,
      };
    } catch (error) {
      throw new BadRequestException('Failed to process image');
    }
  }
}