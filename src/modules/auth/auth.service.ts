import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { SignupRequest } from './dtos/request/signup.request';
import { TokenPayload } from '../../common/types/auth-token-payload.type';
import { HelperService } from '../../common/utils/helper/helper.service';
import { DatabaseService } from '../../configs/database/database.service';
import { Session, User } from '@prisma/client';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly helperService: HelperService,
    private readonly prisma: DatabaseService,
    private readonly jwtService: JwtService,
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
    // Find user without throwing errors to prevent info leakage
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Return generic error for all cases: not found, inactive, no password, wrong password
    if (!user || !user.active || !user.password) {
      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Verify password
    const isPasswordValid = await this.helperService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new GenericHttpException(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

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

  private generateAuthToken(
    payload: TokenPayload,
    isTemporary = false,
  ): string {
    return this.jwtService.sign(payload, {
      ...(isTemporary && { expiresIn: '30m' }),
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
      throw new GenericHttpException(
        ERROR_MESSAGES.LOGOUT_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
