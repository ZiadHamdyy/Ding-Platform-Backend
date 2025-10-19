import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { HelperModule } from '../../common/utils/helper/helper.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionModule } from '../session/session.module';
import { LocalStrategy } from '../../common/strategies/local.strategy';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    UserModule,
    HelperModule,
    SessionModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
