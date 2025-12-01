import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  root() {
    return {
      message: 'Ding Platform Backend API',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/health',
    };
  }
}
