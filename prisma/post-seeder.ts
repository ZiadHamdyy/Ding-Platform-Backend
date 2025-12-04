import { PrismaClient, PostPrivacy } from '@prisma/client';

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
  "Life is good. 😊",
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomPostPrivacy(): PostPrivacy {
  const r = Math.random();

  if (r < 0.6) return PostPrivacy.PUBLIC; // ~60%
  if (r < 0.85) return PostPrivacy.FRIENDS; // ~25%
  return PostPrivacy.ONLY_ME; // ~15%
}

function getRandomPastDate(daysBack: number): Date {
  const now = Date.now();
  const maxOffsetMs = daysBack * 24 * 60 * 60 * 1000;
  const offset = Math.floor(Math.random() * maxOffsetMs);
  return new Date(now - offset);
}

export async function seedPostsForUsers(
  prisma: PrismaClient,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) {
    console.log('⚠️ No users provided for post seeding. Skipping post creation.\n');
    return;
  }

  console.log(`\n🌱 Starting post seeding for ${userIds.length} user(s)...`);

  const postsData: {
    content: string;
    authorId: string;
    privacy: PostPrivacy;
    createdAt: Date;
  }[] = [];

  for (const userId of userIds) {
    // Medium density: 5–20 posts per user
    const postCount = 5 + Math.floor(Math.random() * 16); // 5..20 inclusive

    for (let i = 0; i < postCount; i++) {
      const template = getRandomElement(postTemplates);

      postsData.push({
        content: `${template}`,
        authorId: userId,
        privacy: getRandomPostPrivacy(),
        // Random date in the last 90 days
        createdAt: getRandomPastDate(90),
      });
    }
  }

  console.log(
    `📦 Preparing to create ${postsData.length} posts (avg ~${(
      postsData.length / userIds.length
    ).toFixed(1)} per user)...`,
  );

  const batchSize = 1000;
  let createdTotal = 0;

  for (let i = 0; i < postsData.length; i += batchSize) {
    const batch = postsData.slice(i, i + batchSize);

    const result = await prisma.post.createMany({
      data: batch,
    });

    createdTotal += result.count;
    console.log(
      `  ✅ Created ${createdTotal}/${postsData.length} posts so far...`,
    );
  }

  console.log(
    `🎉 Finished post seeding. Created ${createdTotal} posts for ${userIds.length} user(s) (avg ~${(
      createdTotal / userIds.length
    ).toFixed(1)} per user).\n`,
  );
}


