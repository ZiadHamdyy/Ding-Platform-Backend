import {
  Controller,
  Get,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { TerminateSessionRequest } from './dto/request/terminate-session.request';
import { Session } from '@prisma/client';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllSessions(@Param('userId') userId: string) {
    const sessions = await this.sessionService.getAllUserSessions(
      userId,
    );
    const meta = await this.sessionService.getSessionCount(userId);

    return {
      success: true,
      message: 'Sessions retrieved successfully',
      data: sessions,
      meta,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async removeCurrentSession(@Param('sessionId') sessionId: string) {
    await this.sessionService.remove({ id: sessionId } as Session);
    return {
      success: true,
      message: 'Current session terminated successfully',
    };
  }

  @Delete('all')
  @HttpCode(HttpStatus.OK)
  async removeAllSessions(@Param('userId') userId: string) {
    await this.sessionService.terminateAllSessions(userId);
    return {
      success: true,
      message: 'All sessions terminated successfully',
    };
  }

  @Delete('terminate')
  @HttpCode(HttpStatus.OK)
  async terminateSession(
    @Param('userId') userId: string,
    @Body() terminateSessionRequest: TerminateSessionRequest,
  ) {
    await this.sessionService.terminateSession(
      terminateSessionRequest.sessionId,
      userId,
    );
    return {
      success: true,
      message: 'Session terminated successfully',
    };
  }
}
