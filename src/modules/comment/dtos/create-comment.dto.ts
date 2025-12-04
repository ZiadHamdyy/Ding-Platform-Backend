import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
  content: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent comment ID must be a valid UUID' })
  parentCommentId?: string;
}


