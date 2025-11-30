import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsArray,
  IsUUID,
} from 'class-validator';
import { POST_CONSTANTS } from '../../../common/constants/post.constants';

export enum PostPrivacy {
  PUBLIC = 'PUBLIC',
  FRIENDS = 'FRIENDS',
  FRIENDS_OF_FRIENDS = 'FRIENDS_OF_FRIENDS',
  ONLY_ME = 'ONLY_ME',
  CUSTOM = 'CUSTOM',
}

export class CreatePostDto {
  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  @MaxLength(POST_CONSTANTS.VALIDATION.MAX_CONTENT_LENGTH, {
    message: `Content must not exceed ${POST_CONSTANTS.VALIDATION.MAX_CONTENT_LENGTH} characters`,
  })
  content: string;

  @IsNotEmpty({ message: 'Author ID is required' })
  @IsString({ message: 'Author ID must be a string' })
  @IsUUID('4', { message: 'Author ID must be a valid UUID' })
  authorId: string;

  @IsOptional()
  @IsEnum(PostPrivacy, { message: 'Invalid privacy setting' })
  privacy?: PostPrivacy = PostPrivacy.PUBLIC;

  @IsOptional()
  @IsArray({ message: 'Custom audience must be an array' })
  @IsUUID('4', { each: true, message: 'Each audience ID must be a valid UUID' })
  customAudienceIds?: string[];
}

