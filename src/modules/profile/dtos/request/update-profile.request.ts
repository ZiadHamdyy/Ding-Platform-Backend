import {
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  IsAdult,
  IsValidDateOfBirth,
} from '../../../../common/validators/custom-validators';
import { PROFILE_CONSTANTS } from '../../../../common/constants/profile.constants';
import { PROFILE_ERROR_MESSAGES } from '../../../../common/constants/profile-error-messages.constant';

export class UpdateProfileRequest {
  @IsOptional()
  @IsString()
  @MaxLength(PROFILE_CONSTANTS.FIELDS.BIO_MAX_LENGTH, {
    message: PROFILE_ERROR_MESSAGES.BIO_TOO_LONG,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(PROFILE_CONSTANTS.FIELDS.LOCATION_MAX_LENGTH, {
    message: PROFILE_ERROR_MESSAGES.LOCATION_TOO_LONG,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  location?: string;

  @IsOptional()
  @IsUrl({}, { message: PROFILE_ERROR_MESSAGES.INVALID_WEBSITE_URL })
  @MaxLength(PROFILE_CONSTANTS.FIELDS.WEBSITE_MAX_LENGTH)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(PROFILE_CONSTANTS.FIELDS.PHONE_MAX_LENGTH)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  phoneNumber?: string;

  @IsOptional()
  @IsDateString({}, { message: PROFILE_ERROR_MESSAGES.INVALID_DATE_OF_BIRTH })
  @IsValidDateOfBirth()
  @IsAdult()
  dateOfBirth?: Date;
}
