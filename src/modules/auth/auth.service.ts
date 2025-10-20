import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { SignupRequest } from './dtos/request/signup.request';
import { TokenPayload } from '../../common/types/auth-token-payload.type';
import { HelperService } from '../../common/utils/helper/helper.service';
import { DatabaseService } from '../../configs/database/database.service';
import { Session, User } from '@prisma/client';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';
import { ERROR_MESSAGES, TOKEN_CONSTANTS } from '../../common/constants';
import { SessionService } from '../session/session.service';
import type { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly helperService: HelperService,
    private readonly prisma: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
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

  async login(user: User, ipAddress?: string, userAgent?: string) {
    // Generate refresh token first
    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      sessionId: 'temp', // Will be replaced after session creation
    });

    // Create session with refresh token (hashed in DB)
    const session = await this.sessionService.create(
      user,
      refreshToken,
      ipAddress,
      userAgent,
    );

    // Return tokens and user (refreshToken for cookie, accessToken for response)
    return this.appendAuthTokenToResponse(user, session, refreshToken);
  }

  async loginWithCookie(
    user: User,
    ipAddress: string,
    userAgent: string,
    response: Response,
  ) {
    const result = await this.login(user, ipAddress, userAgent);
    
    // Set HttpOnly cookie for refresh token
    this.setRefreshTokenCookie(response, result.refreshToken);
    
    return result;
  }

  async appendAuthTokenToResponse(user: User, session: Session, refreshToken: string) {
    const accessToken = this.generateAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Return both tokens internally - controller will use refreshToken for cookie
    // Serializer will only expose accessToken and user in response body
    return {
      user,
      accessToken,
      refreshToken, // For HttpOnly cookie only (not serialized in response)
    };
  }

  private generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: TOKEN_CONSTANTS.ACCESS_TOKEN.EXPIRES_IN,
    });
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: TOKEN_CONSTANTS.REFRESH_TOKEN.EXPIRES_IN,
    });
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verify the refresh token (already verified by guard, but verify again for security)
      const payload = this.jwtService.verify<TokenPayload>(refreshToken);

      // Find the session with this refresh token
      const session = await this.sessionService.findByRefreshToken(refreshToken);

      if (!session || session.userId !== payload.userId) {
        // If session not found or user ID doesn't match, delete the session
        if (session) {
          await this.sessionService.remove(session);
        }
        throw new GenericHttpException(
          ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Check if user is still active
      if (!session.user.active) {
        // If user is blocked, delete the session
        await this.sessionService.remove(session);
        throw new GenericHttpException(
          ERROR_MESSAGES.USER_BLOCKED,
          HttpStatus.FORBIDDEN,
        );
      }

      // Generate ONLY new access token (refresh token remains the same)
      const newAccessToken = this.generateAccessToken({
        userId: session.userId,
        sessionId: session.id,
      });

      // Return only the new access token
      // Refresh token stays the same and doesn't need to be updated in DB
      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      if (error instanceof GenericHttpException) {
        throw error;
      }
      throw new GenericHttpException(
        ERROR_MESSAGES.TOKEN_REFRESH_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshTokensWithCookie(refreshToken: string, response: Response) {
    try {
      const result = await this.refreshTokens(refreshToken);
      
      // No need to update the refresh token cookie since it remains the same
      // The refresh token stays valid until it expires or user logs out
      
      return result;
    } catch (error) {
      // If refresh fails (e.g., expired token), clear the refresh token cookie
      this.clearRefreshTokenCookie(response);
      throw error;
    }
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

  async logoutWithCookie(user: User, sessionId: string | undefined, response: Response) {
    const result = await this.logout(user, sessionId);
    
    // Clear refresh token cookie
    this.clearRefreshTokenCookie(response);
    
    return result;
  }

  async logoutAllWithCookie(user: User, response: Response) {
    const result = await this.logout(user);
    
    // Clear refresh token cookie
    this.clearRefreshTokenCookie(response);
    
    return result;
  }

  // Private helper methods for cookie management
  private setRefreshTokenCookie(response: Response, refreshToken: string): void {
    response.cookie(TOKEN_CONSTANTS.COOKIE.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: TOKEN_CONSTANTS.COOKIE.HTTP_ONLY,
      secure: TOKEN_CONSTANTS.COOKIE.SECURE,
      sameSite: TOKEN_CONSTANTS.COOKIE.SAME_SITE,
      // No maxAge - persistent cookie (no expiration)
      path: TOKEN_CONSTANTS.COOKIE.PATH,
    });
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(TOKEN_CONSTANTS.COOKIE.REFRESH_TOKEN_NAME);
  }

}
