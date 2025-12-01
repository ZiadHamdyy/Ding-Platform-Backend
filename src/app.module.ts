import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './configs/database/database.module';
import { Neo4jModule } from './configs/neo4j/neo4j.module';
import { LoggerModule } from './common/application/logger/logger.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/application/exceptions/exception-filter';
import { ValidationPipe } from './common/application/exceptions/validation.pipe';
import { ContextModule } from './common/application/context/context.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SessionModule } from './modules/session/session.module';
import { ProfileModule } from './modules/profile/profile.module';
import { CloudinaryModule } from './common/services/cloudinary/cloudinary.module';
import { SocialModule } from './modules/social/social.module';
import { PostModule } from './modules/post/post.module';
import { FeedModule } from './modules/feed/feed.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    DatabaseModule,
    Neo4jModule,
    ContextModule,
    AuthModule,
    UserModule,
    SessionModule,
    ProfileModule,
    CloudinaryModule,
    SocialModule,
    PostModule,
    FeedModule,
    PrivacyModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
    {
      provide: APP_FILTER,
      useFactory: (logger: PinoLogger) => {
        return new HttpExceptionFilter(logger);
      },
      inject: [PinoLogger],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
