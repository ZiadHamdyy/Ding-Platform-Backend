import { Expose, Type } from 'class-transformer';

export class CommentAuthorDto {
  @Expose()
  id: string;

  @Expose()
  name?: string | null;

  @Expose()
  image?: string | null;
}

export class CommentResponseDto {
  @Expose()
  id: string;

  @Expose()
  content: string;

  @Expose()
  postId: string;

  @Expose()
  parentCommentId?: string | null;

  @Expose()
  replyCount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => CommentAuthorDto)
  author?: CommentAuthorDto | null;
}


