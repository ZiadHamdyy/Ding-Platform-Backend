import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupRequest } from './dtos/request/signup.request';
import { AuthResponse } from './dtos/responses/auth.response';

import { LoginRequest } from './dtos/request/login.request';
import { LocalAuthGuard } from '../../common/guards/strategy.guards/local.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { clientIp } from '../../common/decorators/client-ip.decorator';
import { userAgent } from '../../common/decorators/user-agent.decorator';
import type { currentUserType } from '../../common/types/current-user.type';
import { UserResponse } from '../../modules/user/dtos/response/user.response';
import { SessionService } from '../session/session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('signup')
  @Serialize(UserResponse)
  @HttpCode(HttpStatus.OK)
  async signup(@Body() signupRequest: SignupRequest) {
    console.log(signupRequest);
    return await this.authService.signup(signupRequest);
  }

  @Post('login')
  @Serialize(AuthResponse)
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(@Body() _: LoginRequest, @currentUser() user: currentUserType, @clientIp() ipAddress: string, @userAgent() userAgent: string) {
    if (!user.emailVerified) return { user };
    const session = await this.sessionService.create(user, ipAddress, userAgent);
    return await this.authService.appendAuthTokenToResponse(user, session);
  }

  @Delete('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async logout(@currentUser() user: currentUserType) {
    return await this.authService.logout(user, user.session?.id);
  }

  @Delete('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async logoutAll(@currentUser() user: currentUserType) {
    return await this.authService.logout(user);
  }

  @Get('/me')
  @Serialize(UserResponse)
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async getMe(@currentUser() user: currentUserType) {
    return user;
  }
}
