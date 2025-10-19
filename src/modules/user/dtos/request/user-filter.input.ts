import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UsernameInput {
  @IsNotEmpty({ message: 'USERNAME_REQUIRED' })
  @MinLength(6, { message: 'USERNAME_MIN_LENGTH_6' })
  @IsString({ message: 'USERNAME_SHOULD_BE_STRING' })
  username: string;
}

export class UserEmailInput {
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  @IsString({ message: 'EMAIL_SHOULD_BE_STRING' })
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  email: string;
}

export class UserIdInput {
  @IsNotEmpty({ message: 'USER_ID_REQUIRED' })
  @IsString({ message: 'USER_ID_SHOULD_BE_STRING_FILTER' })
  userId: string;
}

export class UserListFilterInput {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 8;

  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'email' | 'role' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
