import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CheckEmailRequest {
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  @IsString({ message: 'EMAIL_SHOULD_BE_STRING' })
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  email: string;
}
