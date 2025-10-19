import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ToggleUserActivityRequest {
  @IsNotEmpty({ message: 'USER_ID_REQUIRED' })
  @IsString({ message: 'USER_ID_SHOULD_BE_STRING' })
  userId: string;

  @IsNotEmpty({ message: 'ACTIVE_STATUS_REQUIRED' })
  @IsBoolean({ message: 'ACTIVE_STATUS_SHOULD_BE_BOOLEAN' })
  active: boolean;
}
