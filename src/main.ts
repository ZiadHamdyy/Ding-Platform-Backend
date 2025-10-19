import helmet from 'helmet';
import { get } from 'env-var';
import { json, static as staticMiddleware } from 'express';
import { AppModule } from './app.module';
import compression from 'compression';
import { NestFactory } from '@nestjs/core';
import rateLimit from 'express-rate-limit';
import { existsSync, mkdirSync, writeFile } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// Global filters and pipes are set up in AppModule
import * as path from 'path';

function initializeLogging() {
  const logDir = 'logs';
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
    writeFile(`${logDir}/logs.out`, '', (err) => {
      if (err) console.log(err);
    });
  }
}

function setupMiddlewares(app: NestExpressApplication) {
  // Setup JSON parsing for all routes
  app.use(json());
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
}

function setupRateLimiter(app: NestExpressApplication) {
  app.use(rateLimit({ windowMs: 60000, max: 100 }));
}

function setupStaticFileServing(app: NestExpressApplication) {
  // Get upload directory from environment or use default
  const uploadDir = get('UPLOAD_DIR').default('./uploads').asString();
  const uploadPath = path.resolve(uploadDir);

  // Ensure upload directory exists
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }

  // Serve static files from uploads directory
  app.use('/uploads', staticMiddleware(uploadPath));

  console.log(`Static file serving enabled for: ${uploadPath}`);
}

function setupGlobalFilters(app: NestExpressApplication) {
  // Global filters are set up in AppModule with proper dependency injection
  // Global validation pipe is also set up in AppModule
}

function setupSwagger(app: NestExpressApplication) {
  const config = new DocumentBuilder()
    .setTitle('Ding Platform API')
    .setDescription('The Ding Platform API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

async function bootstrap(): Promise<void> {
  if (get('NODE_ENV').asString() === 'production') initializeLogging();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: { origin: '*' },
  });

  app.setGlobalPrefix('api/v1');
  setupMiddlewares(app);
  setupGlobalFilters(app);
  setupStaticFileServing(app);
  setupSwagger(app);

  if (get('NODE_ENV').asString() === 'production') setupRateLimiter(app);

  const port = get('PORT').default('3000').asString();
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
