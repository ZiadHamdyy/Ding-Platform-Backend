import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SignupRequest {
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @Transform(({ value }) => value.toLowerCase(), { toClassOnly: true })
  email: string;

  @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
  @IsString({ message: 'PASSWORD_SHOULD_BE_STRING' })
  @MinLength(8, { message: 'PASSWORD_MIN_LENGTH_8_MAX_25' })
  @MaxLength(25, { message: 'PASSWORD_MIN_LENGTH_8_MAX_25' })
  password: string;

  @IsOptional()
  @IsString({ message: 'NAME_SHOULD_BE_STRING' })
  @MaxLength(25, { message: 'NAME_MAX_LENGTH_25' })
  @MinLength(3, { message: 'NAME_MIN_LENGTH_3' })
  name: string;

  @IsOptional()
  @IsString({ message: 'IMAGE_SHOULD_BE_STRING' })
  @MaxLength(255, { message: 'IMAGE_MAX_LENGTH_255' })
  image: string;
}
