import helmet from 'helmet';
import { get } from 'env-var';
import { json, static as staticMiddleware } from 'express';
import { AppModule } from './app.module';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import rateLimit from 'express-rate-limit';
import { existsSync, mkdirSync, writeFile } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { APP_CONSTANTS } from './common/constants';
// Global filters and pipes are set up in AppModule
import * as path from 'path';

function initializeLogging() {
  // Skip file logging in serverless environments (Vercel, AWS Lambda, etc.)
  if (process.env.VERCEL === '1') {
    return;
  }

  const logDir = 'logs';
  try {
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
      writeFile(`${logDir}/logs.out`, '', (err) => {
        if (err) console.log(err);
      });
    }
  } catch (error) {
    // Silently fail in environments where filesystem is read-only
    console.warn('Could not initialize file logging:', error.message);
  }
}

function setupMiddlewares(app: NestExpressApplication) {
  // Setup JSON parsing for all routes
  app.use(json());
  app.use(compression());
  app.use(cookieParser()); // Enable cookie parsing for HttpOnly cookies
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
  // Skip static file serving setup in serverless environments (Vercel)
  // In serverless, files should be served via cloud storage (S3, Cloudinary, etc.)
  if (process.env.VERCEL === '1') {
    console.log('Static file serving skipped in serverless environment');
    return;
  }

  // Get upload directory from environment or use default
  const uploadDir = get('UPLOAD_DIR').default('./uploads').asString();
  const uploadPath = path.resolve(uploadDir);

  // Ensure upload directory exists
  try {
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    // Serve static files from uploads directory
    app.use('/uploads', staticMiddleware(uploadPath));
    console.log(`Static file serving enabled for: ${uploadPath}`);
  } catch (error) {
    // Silently fail in environments where filesystem is read-only
    console.warn('Could not setup static file serving:', error.message);
  }
}

function setupGlobalFilters(app: NestExpressApplication) {
  // Global filters are set up in AppModule with proper dependency injection
  // Global validation pipe is also set up in AppModule
}

function setupSwagger(app: NestExpressApplication) {
  const config = new DocumentBuilder()
    .setTitle(APP_CONSTANTS.APP.NAME)
    .setDescription(APP_CONSTANTS.APP.DESCRIPTION)
    .setVersion(APP_CONSTANTS.APP.VERSION)
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
  SwaggerModule.setup(APP_CONSTANTS.API.DOCS_PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

let cachedApp: NestExpressApplication;

async function bootstrap(): Promise<NestExpressApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  if (get('NODE_ENV').asString() === 'production') initializeLogging();

  const frontendUrl = get('FRONTEND_URL').default('http://localhost:5173').asString();
  const isProduction = get('NODE_ENV').asString() === 'production';

  // Build allowed origins array: always include frontendUrl and localhost:5173
  const allowedOrigins = [frontendUrl, 'http://localhost:5173'];
  // Remove duplicates in case frontendUrl is already localhost:5173
  const uniqueOrigins = Array.from(new Set(allowedOrigins));

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: isProduction ? uniqueOrigins : true, // Allow all in dev, restrict to specific origins in prod
      credentials: true, // Enable cookies/credentials
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      exposedHeaders: ['Set-Cookie'],
    },
  });

  app.setGlobalPrefix(APP_CONSTANTS.API.PREFIX);
  setupMiddlewares(app);
  setupGlobalFilters(app);
  setupStaticFileServing(app);
  setupSwagger(app);

  if (get('NODE_ENV').asString() === 'production') setupRateLimiter(app);

  // Initialize the app (without calling listen) for serverless
  await app.init();

  // Only listen in non-serverless environments
  if (process.env.VERCEL !== '1') {
    const port = get('PORT').default('3000').asString();
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger documentation available at: http://localhost:${port}/${APP_CONSTANTS.API.DOCS_PATH}`);
  }

  cachedApp = app;
  return app;
}

// For Vercel serverless functions
if (process.env.VERCEL === '1') {
  // Export the handler for Vercel
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  module.exports = async (req: any, res: any) => {
    const app = await bootstrap();
    const expressApp = app.getHttpAdapter().getInstance() as any;
    expressApp(req, res);
  };
} else {
  // For local development and other environments
  bootstrap();
}
