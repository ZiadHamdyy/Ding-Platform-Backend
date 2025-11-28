import { IsNotEmpty, IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Comment content is required' })
  @IsString({ message: 'Comment content must be a string' })
  @MaxLength(1000, { message: 'Comment cannot exceed 1000 characters' })
  content: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent comment ID must be a valid UUID' })
  parentId?: string;
}
