import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto, PostPrivacy } from './create_post.dto';
import { IsOptional, IsString, MaxLength, IsEnum, IsArray, IsUUID } from 'class-validator';
import { POST_CONSTANTS } from 'src/common/constants/post.constants';

export class UpdatePostDto {
  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  @MaxLength(POST_CONSTANTS.VALIDATION.MAX_CONTENT_LENGTH, {
    message: `Content must not exceed ${POST_CONSTANTS.VALIDATION.MAX_CONTENT_LENGTH} characters`,
  })
  content?: string;

  @IsOptional()
  @IsEnum(PostPrivacy, { message: 'Invalid privacy setting' })
  privacy?: PostPrivacy;

  @IsOptional()
  @IsArray({ message: 'Custom audience must be an array' })
  @IsUUID('4', { each: true, message: 'Each audience ID must be a valid UUID' })
  customAudienceIds?: string[];
}
