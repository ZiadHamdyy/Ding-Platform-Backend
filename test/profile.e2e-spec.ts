import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/configs/database/database.service';

describe('Profile (e2e)', () => {
  let app: INestApplication;
  let prisma: DatabaseService;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();

    prisma = app.get<DatabaseService>(DatabaseService);

    // Create test user and login
    const signupRes = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'profiletest@example.com',
        password: 'Test1234!',
        name: 'Profile Test',
      });

    userId = signupRes.body.data.id;

    // Verify email
    const otp = await prisma.otp.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({
        email: 'profiletest@example.com',
        otp: otp ? await getOtpValue(otp.otpHash) : '123456',
      });

    accessToken = verifyRes.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.otp.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.profile.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  describe('/profile (PUT)', () => {
    it('should create/update profile', () => {
      return request(app.getHttpServer())
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bio: 'Test bio for e2e testing',
          location: 'Cairo, Egypt',
          website: 'https://example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty(
            'bio',
            'Test bio for e2e testing',
          );
          expect(res.body.data).toHaveProperty('location', 'Cairo, Egypt');
        });
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          website: 'not-a-valid-url',
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put('/api/v1/profile')
        .send({
          bio: 'Test bio',
        })
        .expect(401);
    });
  });

  describe('/profile/:userId (GET)', () => {
    it('should get own profile', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/profile/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('userId', userId);
        });
    });

    it('should get public profile without auth', async () => {
      // First set profile to public
      await request(app.getHttpServer())
        .patch('/api/v1/profile/privacy')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profileVisibility: 'PUBLIC',
        });

      return request(app.getHttpServer())
        .get(`/api/v1/profile/${userId}`)
        .expect(200);
    });
  });

  describe('/profile/privacy (PATCH)', () => {
    it('should update privacy settings', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/profile/privacy')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profileVisibility: 'FRIENDS',
          postsVisibility: 'PUBLIC',
          emailVisibility: 'PRIVATE',
          allowCameraAccess: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('profileVisibility', 'FRIENDS');
          expect(res.body.data).toHaveProperty('allowCameraAccess', true);
        });
    });

    it('should fail with invalid visibility type', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/profile/privacy')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profileVisibility: 'INVALID_TYPE',
        })
        .expect(400);
    });
  });

  describe('/profile/search (GET)', () => {
    it('should search profiles', () => {
      return request(app.getHttpServer())
        .get('/api/v1/profile/search')
        .query({ query: 'Profile Test', page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('page', 1);
        });
    });

    it('should filter by location', () => {
      return request(app.getHttpServer())
        .get('/api/v1/profile/search')
        .query({ location: 'Cairo', page: 1, limit: 10 })
        .expect(200);
    });
  });

  describe('/profile (DELETE)', () => {
    it('should delete profile', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  // Helper function (simplified - in real scenario you'd need proper OTP handling)
  async function getOtpValue(otpHash: string): Promise<string> {
    // In real tests, you'd generate and store the OTP properly
    return '123456';
  }
});
