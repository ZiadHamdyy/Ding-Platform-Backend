import { get } from 'env-var';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SignupRequest } from './dtos/request/signup.request';
import { TokenPayload } from '../../common/types/auth-token-payload.type';
import { HelperService } from '../../common/utils/helper/helper.service';
import { DatabaseService } from '../../configs/database/database.service';
import { Session, User } from '@prisma/client';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly helperService: HelperService,
    private readonly prisma: DatabaseService,
  ) {}

  async signup(request: SignupRequest) {
    const { email, password, name, image } = request;
    await this.userService.errorIfUserExists(email);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: await this.helperService.hashPassword(password),
        name: name || email.split('@')[0],
        image,
        active: true,
        emailVerified: true,
      },
    });

    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.getLoginUserOrError({
      email,
    });
    if (!user.password)
      throw new GenericHttpException(
        'No password found',
        HttpStatus.BAD_REQUEST,
      );
    await this.matchPassword(password, user.password);
    return user;
  }

  async appendAuthTokenToResponse(user: User, session: Session) {
    return {
      user,
      token: this.generateAuthToken({
        userId: user.id,
        sessionId: session.id,
      }),
    };
  }

  private async matchPassword(password: string, hash: string) {
    const isMatched = await bcrypt.compare(password, hash);
    if (!isMatched) {
      throw new GenericHttpException(
        'Invalid email or password',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private generateAuthToken(
    payload: TokenPayload,
    isTemporary = false,
  ): string {
    return jwt.sign(payload, get('JWT_SECRET').required().asString(), {
      algorithm: 'HS256',
      ...(isTemporary && { expiresIn: 30 * 60 }),
    });
  }

  async logout(user: User, sessionId?: string) {
    try {
      if (sessionId) {
        // Delete specific session
        await this.prisma.session.delete({
          where: { id: sessionId, userId: user.id },
        });
      } else {
        // Delete all sessions for the user (sign out from all devices)
        await this.prisma.session.deleteMany({
          where: { userId: user.id },
        });
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      throw new GenericHttpException(
        'Failed to logout',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
