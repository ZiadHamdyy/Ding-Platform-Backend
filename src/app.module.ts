import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SessionModule } from './modules/session/session.module';
import { DatabaseModule } from './configs/database/database.module';

@Module({
  imports: [DatabaseModule, SessionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
