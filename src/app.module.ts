import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionModule } from './modules/session/session.module';
import { DatabaseModule } from './configs/database/database.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContextModule } from './common/application/context/context.module';

@Module({
  imports: [DatabaseModule, ContextModule, SessionModule, UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
