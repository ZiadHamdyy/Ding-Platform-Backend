import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SignupRequest } from './dtos/request/signup.request';
import { AuthResponse } from './dtos/responses/auth.response';
import { RefreshTokenResponse } from './dtos/responses/refresh-token.response';
import { LoginRequest } from './dtos/request/login.request';
import { LocalAuthGuard } from '../../common/guards/strategy.guards/local.guard';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { RefreshToken } from '../../common/decorators/refresh-token.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { clientIp } from '../../common/decorators/client-ip.decorator';
import { userAgent } from '../../common/decorators/user-agent.decorator';
import type { currentUserType } from '../../common/types/current-user.type';
import { UserResponse } from '../../modules/user/dtos/response/user.response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Serialize(UserResponse)
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupRequest: SignupRequest) {
    return await this.authService.signup(signupRequest);
  }

  @Post('login')
  @Serialize(AuthResponse)
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(
    @Body() _: LoginRequest,
    @currentUser() user: currentUserType,
    @clientIp() ipAddress: string,
    @userAgent() userAgent: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.loginWithCookie(user, ipAddress, userAgent, response);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @Serialize(RefreshTokenResponse)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.refreshTokensWithCookie(refreshToken, response);
  }

  @Delete('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async logout(
    @currentUser() user: currentUserType,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.logoutWithCookie(user, user.session?.id, response);
  }

  @Delete('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async logoutAll(
    @currentUser() user: currentUserType,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.logoutAllWithCookie(user, response);
  }

  @Get('/me')
  @Serialize(UserResponse)
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async getMe(@currentUser() user: currentUserType) {
    return user;
  }
}
