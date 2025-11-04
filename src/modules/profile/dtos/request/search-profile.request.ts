import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PROFILE_CONSTANTS } from '../../../../common/constants/profile.constants';

export class SearchProfileRequest {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = PROFILE_CONSTANTS.SEARCH.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PROFILE_CONSTANTS.SEARCH.MAX_LIMIT)
  limit?: number = PROFILE_CONSTANTS.SEARCH.DEFAULT_LIMIT;
}
