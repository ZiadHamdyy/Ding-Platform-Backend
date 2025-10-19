import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginRequest {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toLowerCase(), { toClassOnly: true })
  email: string;

  @MinLength(6)
  @MaxLength(30)
  @IsNotEmpty()
  password: string;
}
