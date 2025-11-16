import pino from 'pino';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Module, Global } from '@nestjs/common';
import { createWriteStream } from 'pino-sentry';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService): any => {
        // Check both ConfigService and process.env for environment detection
        const nodeEnv = config.get('NODE_ENV') || process.env.NODE_ENV || 'development';
        const isProduction = nodeEnv === 'production';
        const isTest = nodeEnv === 'test';

        // Custom response serializer that includes status code
        const customResSerializer = (res: any) => {
          const serialized = pino.stdSerializers.res(res);
          return {
            ...serialized,
            statusCode: res.statusCode || res.status || 'unknown',
          };
        };

        // Base configuration
        const baseConfig = {
          name: 'Pino',
          level: isProduction ? 'info' : 'warn',
          timestamp: () => `, "Time": "${new Date().toISOString()}"`,
          redact: ['password', 'headers.cookie'],
          safe: true,
          enabled: !isTest,
          serializers: {
            err: pino.stdSerializers.err,
            req: pino.stdSerializers.req,
            res: customResSerializer,
          },
          useLevel: isProduction ? 'info' : 'debug',
          genReqId: (req: any) => req.id || randomUUID(),
          autoLogging: {
            ignore: (req: any) => {
              // Don't log health checks or static assets
              return (
                req.url?.includes('/health') ||
                req.url?.includes('/api/docs') ||
                req.url?.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)
              );
            },
          },
        };

        if (!isProduction && process.env.VERCEL !== '1') {
          return {
            pinoHttp: {
              ...baseConfig,
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  levelFirst: true,
                  crlf: true,
                },
              },
            },
          };
        }

        // Production configuration with multistream
        const streams: any[] = [{ stream: process.stdout }];

        // Add file logging if logs directory exists
        const logDir = path.join(process.cwd(), 'logs');
        if (fs.existsSync(logDir)) {
          streams.push({
            stream: fs.createWriteStream(path.join(logDir, 'logs.out')),
          });
        }

        // Add Sentry logging if DSN is configured
        const sentryDsn = config.get('SENTRY_DNS');
        if (sentryDsn) {
          try {
            streams.push({
              stream: createWriteStream({
                sentry: {
                  dsn: sentryDsn,
                },
                serverName: config.get('SERVER_NAME'),
              } as any),
            });
          } catch (error) {
            // Silently fail if Sentry stream creation fails
            console.warn('Failed to create Sentry stream:', error);
          }
        }

        const productionLogger = pino(
          { level: 'info' },
          streams.length > 1 ? pino.multistream(streams) : streams[0].stream,
        );

        return {
          pinoHttp: {
            ...baseConfig,
            logger: productionLogger,
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
