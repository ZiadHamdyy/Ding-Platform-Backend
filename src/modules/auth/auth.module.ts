import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ContextModule } from '../../common/application/context/context.module';
import { HelperModule } from '../../common/utils/helper/helper.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionModule } from '../session/session.module';
import { LocalStrategy } from '../../common/strategies/local.strategy';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const options: JwtModuleOptions = {
          secret: configService.get('JWT_SECRET'),
          signOptions: { algorithm: 'HS256' },
          verifyOptions: { algorithms: ['HS256'] },
        };
        return options;
      },
    }),
    ContextModule,
    PassportModule,
    UserModule,
    HelperModule,
    SessionModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
