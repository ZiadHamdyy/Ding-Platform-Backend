import { Injectable } from '@nestjs/common';
import { Session, User, SessionStatus } from '@prisma/client';
import { DatabaseService } from '../../configs/database/database.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(user: User, ipAddress?: string, userAgent?: string) {
    return this.prisma.session.create({
      data: {
        userId: user.id,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
      },
    });
  }

  async remove(session: Session): Promise<void> {
    await this.prisma.session.delete({ where: { id: session.id } });
  }

  async getAllUserSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions.map(session => ({
      id: session.id,
      ipAddress: session.ipAddress || 'Unknown',
      userAgent: session.userAgent || 'Unknown',
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isCurrent: currentSessionId ? session.id === currentSessionId : false,
    }));
  }

  async terminateSession(sessionId: string, userId: string): Promise<void> {
    await this.prisma.session.delete({
      where: {
        id: sessionId,
        userId,
      },
    });
  }

  async terminateAllSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async getSessionCount(userId: string): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([
      this.prisma.session.count({
        where: { userId },
      }),
      this.prisma.session.count({
        where: { userId, status: SessionStatus.ACTIVE },
      }),
    ]);

    return { total, active };
  }
}
