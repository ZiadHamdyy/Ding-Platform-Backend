import { Expose, Type } from 'class-transformer';

export class FeedItemDto {
  @Expose()
  id: string;

  @Expose()
  author: string;

  @Expose()
  time: string;

  @Expose()
  content: string;

  @Expose()
  likes: number;

  @Expose()
  comments: number;

  @Expose()
  image: string | null;
}

export class FeedResponseDto {
  @Expose()
  @Type(() => FeedItemDto)
  data: FeedItemDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;
}
