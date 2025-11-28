import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const postTemplates = [
  "Just had an amazing coffee! ☕️ #MorningVibes",
  "Working on a new project using NestJS and React. It's challenging but fun! 💻",
  "Can't believe it's already Friday! Any plans for the weekend?",
  "The sunset today was absolutely breathtaking. 🌅",
  "Reading a great book about system design. Highly recommend 'Designing Data-Intensive Applications'. 📚",
  "Just finished a 5k run. Feeling energized! 🏃‍♂️",
  "Pizza night! 🍕 What's your favorite topping?",
  "Exploring the new features in TypeScript 5. Pretty cool stuff.",
  "Missing the summer days... ☀️",
  "Anyone else excited for the new Marvel movie? 🎬",
  "Learning to play the guitar. My fingers hurt! 🎸",
  "Coding late into the night. The bug won't fix itself. 🐛",
  "Traveling to Japan next month! Any recommendations? 🇯🇵",
  "Just adopted a new puppy! Meet Max. 🐶",
  "Trying out a new recipe for dinner. Wish me luck! 🍳",
  "The traffic today was a nightmare. 🚗",
  "Grateful for my friends and family. ❤️",
  "Listening to some lo-fi beats while working. 🎧",
  "Thinking about starting a blog. What should I write about? ✍️",
  "Life is good. 😊"
];

async function main() {
  console.log('🌱 Starting post seeding...');

  try {
    // 1. Find a user to assign posts to
    let user = await prisma.user.findFirst();

    if (!user) {
      console.log('⚠️ No users found. Creating a test user...');
      user = await prisma.user.create({
        data: {
          email: 'test.user@example.com',
          name: 'Test User',
          password: 'hashed_password_placeholder', // We don't need a real password for this seed
          emailVerified: true,
          active: true,
        },
      });
      console.log(`✅ Created test user: ${user.id}`);
    } else {
      console.log(`👤 Found existing user: ${user.name} (${user.id})`);
    }

    // 2. Generate 100 posts
    console.log('📦 Generating 100 posts...');
    
    const postsData: any[] = [];
    for (let i = 0; i < 100; i++) {
      const template = postTemplates[Math.floor(Math.random() * postTemplates.length)];
      const content = `${template} (Post #${i + 1})`;
      
      postsData.push({
        content,
        authorId: user.id,
        privacy: 'PUBLIC', // Default to PUBLIC
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)), // Random date in the past
      });
    }

    // 3. Insert posts
    // We use createMany for efficiency
    const result = await prisma.post.createMany({
      data: postsData,
    });

    console.log(`✅ Successfully created ${result.count} posts for user ${user.name}!`);

  } catch (error) {
    console.error('❌ Error seeding posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
