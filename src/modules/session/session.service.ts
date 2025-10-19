import { Injectable, HttpStatus } from '@nestjs/common';
import { Session, User, SessionStatus } from '@prisma/client';
import { DatabaseService } from '../../configs/database/database.service';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(user: User, ipAddress?: string, userAgent?: string) {
    try {
      return await this.prisma.session.create({
        data: {
          userId: user.id,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          status: SessionStatus.ACTIVE,
        },
      });
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_CREATE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(session: Session): Promise<void> {
    try {
      await this.prisma.session.delete({ where: { id: session.id } });
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_DELETE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllUserSessions(userId: string, currentSessionId?: string) {
    try {
      const sessions = await this.prisma.session.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      return sessions.map((session) => ({
        ...session,
        isCurrent: session.id === currentSessionId,
      }));
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_RETRIEVE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSessionCount(userId: string): Promise<{ total: number; active: number }> {
    try {
      const [total, active] = await Promise.all([
        this.prisma.session.count({
          where: { userId },
        }),
        this.prisma.session.count({
          where: { userId, status: SessionStatus.ACTIVE },
        }),
      ]);

      return { total, active };
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_COUNT_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async terminateSession(sessionId: string, userId: string): Promise<void> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          id: sessionId,
          userId: userId,
        },
      });

      if (result.count === 0) {
        throw new GenericHttpException(
          ERROR_MESSAGES.SESSION_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_TERMINATE_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async terminateAllSessions(userId: string): Promise<void> {
    try {
      await this.prisma.session.deleteMany({
        where: { userId },
      });
    } catch (error) {
      throw new GenericHttpException(
        ERROR_MESSAGES.SESSION_TERMINATE_ALL_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
