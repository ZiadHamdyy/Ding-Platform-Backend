import { Expose, Type } from 'class-transformer';
import { ProfileResponse } from './profile.response';

class SearchMeta {
  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  total: number;

  @Expose()
  totalPages: number;

  @Expose()
  hasNextPage: boolean;

  @Expose()
  hasPreviousPage: boolean;
}

export class SearchProfileResponse {
  @Expose()
  @Type(() => ProfileResponse)
  data: ProfileResponse[];

  @Expose()
  @Type(() => SearchMeta)
  meta: SearchMeta;
}
