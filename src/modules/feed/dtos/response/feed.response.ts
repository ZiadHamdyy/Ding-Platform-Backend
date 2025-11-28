import { Expose, Type } from 'class-transformer';

export class FeedItemDto {
  @Expose()
  id: string;

  @Expose()
  content: string;

  @Expose()
  authorId: string;

  @Expose()
  authorName?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  mediaUrls: string[];

  @Expose()
  privacy: string;
}

export class PaginationDto {
  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  total: number;
}

export class FeedResponseDto {
  @Expose()
  @Type(() => FeedItemDto)
  data: FeedItemDto[];

  @Expose()
  @Type(() => PaginationDto)
  meta: PaginationDto;
}
