import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../prisma';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Retry connection with exponential backoff
    const maxRetries = 5;
    const baseDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        console.log('Database connected successfully');
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          console.error('Failed to connect to database after', maxRetries, 'attempts:', error);
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Database connection attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Database connection closed');
  }
}
