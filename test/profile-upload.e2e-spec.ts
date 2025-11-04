import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import { AppModule } from '../src/app.module';

describe('Profile Upload (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup: Create user and get token
    // (Similar to previous test setup)
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/profile/picture (PATCH)', () => {
    it('should upload profile picture', () => {
      const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');

      return request(app.getHttpServer())
        .patch('/api/v1/profile/picture')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', testImagePath)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('imageUrl');
          expect(res.body.data.imageUrl).toContain('cloudinary');
        });
    });

    it('should reject file that is too large', () => {
      // Create a mock large file
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      return request(app.getHttpServer())
        .patch('/api/v1/profile/picture')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', largeBuffer, 'large-image.jpg')
        .expect(400);
    });

    it('should reject invalid file type', () => {
      const testFilePath = path.join(
        __dirname,
        'fixtures',
        'test-document.pdf',
      );

      return request(app.getHttpServer())
        .patch('/api/v1/profile/picture')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', testFilePath)
        .expect(400);
    });
  });

  describe('/profile/cover (PATCH)', () => {
    it('should upload cover photo', () => {
      const testImagePath = path.join(__dirname, 'fixtures', 'test-cover.jpg');

      return request(app.getHttpServer())
        .patch('/api/v1/profile/cover')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', testImagePath)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('coverPhotoUrl');
        });
    });
  });
});
