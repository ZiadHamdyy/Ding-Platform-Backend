import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // Generate unique email for test
    testEmail = `test-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/signup (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('email', testEmail);
          expect(res.body.data).not.toHaveProperty('password');
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(409);
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(400);
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'another@example.com',
          password: 'weak',
          name: 'Test User',
        })
        .expect(400);
    });
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('should reject login with unverified email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!',
        })
        .expect(403);
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });

  describe('/api/v1/auth/forgot-password (PATCH)', () => {
    it('should send OTP for password reset', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/auth/forgot-password')
        .send({
          email: testEmail,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('message');
        });
    });

    it('should handle non-existent email gracefully', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200); // Should return 200 for security
    });
  });

  describe('/api/v1/auth/me (GET)', () => {
    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginAttempts = [];

      // Make multiple rapid login attempts
      for (let i = 0; i < 150; i++) {
        loginAttempts.push(
          request(app.getHttpServer()).post('/api/v1/auth/login').send({
            email: 'test@example.com',
            password: 'password',
          }),
        );
      }

      const results = await Promise.all(loginAttempts);
      const rateLimited = results.some((res) => res.status === 429);

      expect(rateLimited).toBe(true);
    });
  });
});
