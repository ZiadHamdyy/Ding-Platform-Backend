import { IsNotEmpty, IsUUID } from 'class-validator';

export class TerminateSessionRequest {
  @IsNotEmpty({ message: 'SESSION_ID_REQUIRED' })
  @IsUUID('4', { message: 'INVALID_SESSION_ID' })
  sessionId: string;
}
