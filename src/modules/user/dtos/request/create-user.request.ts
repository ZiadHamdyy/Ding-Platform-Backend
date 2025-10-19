import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateUserRequest {
  @IsNotEmpty({ message: 'NAME_REQUIRED' })
  @IsString({ message: 'NAME_SHOULD_BE_STRING' })
  name: string;

  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  email: string;

  @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
  @IsString({ message: 'PASSWORD_SHOULD_BE_STRING' })
  @MinLength(8, { message: 'PASSWORD_MIN_LENGTH_8' })
  password: string;

  @IsOptional()
  @IsString({ message: 'IMAGE_SHOULD_BE_STRING' })
  @MaxLength(500, { message: 'IMAGE_MAX_LENGTH_500' })
  image: string;
}
