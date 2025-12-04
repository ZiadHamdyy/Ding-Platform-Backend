import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { seedPostsForUsers } from './post-seeder';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting standalone post seeding...');

  try {
    // Get all existing users
    let users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'asc' },
    });

    if (users.length === 0) {
      console.log('⚠️ No users found. Creating a test user for post seeding...');
      const testUser = await prisma.user.create({
        data: {
          email: 'test.user@example.com',
          name: 'Test User',
          password: 'hashed_password_placeholder', // We don't need a real password for this seed
          emailVerified: true,
          active: true,
        },
      });
      users = [testUser];
      console.log(`✅ Created test user: ${testUser.id}`);
    } else {
      console.log(`👤 Found ${users.length} existing user(s). Seeding posts for all of them...`);
    }

    const userIds = users.map((u) => u.id);

    // Reuse the shared post seeding helper
    await seedPostsForUsers(prisma, userIds);
  } catch (error) {
    console.error('❌ Error seeding posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
