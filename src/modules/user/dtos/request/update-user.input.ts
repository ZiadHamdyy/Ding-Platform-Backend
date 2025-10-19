import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserInfo {
  @IsOptional()
  @IsString({ message: 'NAME_SHOULD_BE_STRING' })
  @MaxLength(100, { message: 'NAME_MAX_LENGTH_100' })
  name: string;

  @IsOptional()
  @IsString({ message: 'IMAGE_SHOULD_BE_STRING' })
  @MaxLength(500, { message: 'IMAGE_MAX_LENGTH_500' })
  image: string;
}

export class CurrentUserUpdateInput {
  @IsOptional()
  @IsString({ message: 'NAME_SHOULD_BE_STRING' })
  @MaxLength(100, { message: 'NAME_MAX_LENGTH_100' })
  name: string;

  @IsOptional()
  @IsString({ message: 'IMAGE_SHOULD_BE_STRING' })
  @MaxLength(500, { message: 'IMAGE_MAX_LENGTH_500' })
  image: string;
}
