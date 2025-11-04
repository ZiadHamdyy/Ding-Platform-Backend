import { FileValidator } from '@nestjs/common';

export interface ImageValidatorOptions {
  maxSize?: number;
  allowedTypes?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class ImageFileValidator extends FileValidator<ImageValidatorOptions> {
  constructor(protected readonly validationOptions: ImageValidatorOptions) {
    super(validationOptions);
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) {
      return false;
    }

    // Check file size
    if (this.validationOptions.maxSize && file.size > this.validationOptions.maxSize) {
      return false;
    }

    // Check file type
    if (this.validationOptions.allowedTypes) {
      const isAllowedType = this.validationOptions.allowedTypes.some(type =>
        file.mimetype.includes(type)
      );
      if (!isAllowedType) {
        return false;
      }
    }

    return true;
  }

  buildErrorMessage(): string {
    const errors: string[] = [];

    if (this.validationOptions.maxSize) {
      errors.push(`Maximum file size is ${this.validationOptions.maxSize / 1024 / 1024}MB`);
    }

    if (this.validationOptions.allowedTypes) {
      errors.push(`Allowed types: ${this.validationOptions.allowedTypes.join(', ')}`);
    }

    return errors.join('. ');
  }
}