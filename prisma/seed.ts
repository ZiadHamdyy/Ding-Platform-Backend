import { PrismaClient, VisibilityType } from '@prisma/client';
import neo4j, { Driver } from 'neo4j-driver';
import * as bcrypt from 'bcryptjs';
import { get } from 'env-var';
import * as dotenv from 'dotenv';
import { seedPostsForUsers } from './post-seeder';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Initialize Neo4j driver
let neo4jDriver: Driver;

function initNeo4j() {
  const uri = get('NEO4J_URI').default('bolt://localhost:7687').asString();
  
  let username: string;
  let password: string;
  
  const neo4jAuth = get('NEO4J_AUTH').asString();
  if (neo4jAuth) {
    const [authUsername, authPassword] = neo4jAuth.split('/');
    if (!authUsername || !authPassword) {
      throw new Error('NEO4J_AUTH must be in format: username/password');
    }
    username = authUsername;
    password = authPassword;
  } else {
    username = get('NEO4J_USERNAME').default('neo4j').asString();
    password = get('NEO4J_PASSWORD').required().asString();
  }

  neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  return neo4jDriver;
}

// Data generators
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
  'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Jason', 'Rebecca', 'Edward', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
  'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
  'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Gregory', 'Christine', 'Alexander', 'Debra',
  'Patrick', 'Rachel', 'Frank', 'Carolyn', 'Raymond', 'Janet', 'Jack', 'Virginia',
  'Dennis', 'Maria', 'Jerry', 'Heather', 'Tyler', 'Diane', 'Aaron', 'Julie',
  'Jose', 'Joyce', 'Adam', 'Victoria', 'Nathan', 'Kelly', 'Henry', 'Christina',
  'Douglas', 'Joan', 'Zachary', 'Evelyn', 'Kyle', 'Judith', 'Noah', 'Megan',
  'Ethan', 'Cheryl', 'Jeremy', 'Andrea', 'Walter', 'Hannah', 'Christian', 'Jacqueline',
  'Keith', 'Martha', 'Roger', 'Gloria', 'Terry', 'Teresa', 'Gerald', 'Sara',
  'Harold', 'Janice', 'Sean', 'Marie', 'Austin', 'Julia', 'Carl', 'Grace',
  'Arthur', 'Judy', 'Lawrence', 'Theresa', 'Dylan', 'Madison', 'Jesse', 'Beverly',
  'Jordan', 'Denise', 'Bryan', 'Marilyn', 'Billy', 'Amber', 'Joe', 'Danielle',
  'Bruce', 'Rose', 'Gabriel', 'Brittany', 'Logan', 'Diana', 'Albert', 'Abigail',
  'Willie', 'Jane', 'Alan', 'Lori', 'Juan', 'Olivia', 'Wayne', 'Jean',
  'Elijah', 'Catherine', 'Randy', 'Frances', 'Roy', 'Christina', 'Vincent', 'Samantha',
  'Ralph', 'Debra', 'Eugene', 'Rachel', 'Louis', 'Carolyn', 'Philip', 'Janet',
  'Bobby', 'Virginia', 'Johnny', 'Maria', 'Russell', 'Heather', 'Howard', 'Diane',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
  'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
  'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards',
  'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers',
  'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly',
  'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks',
  'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross',
  'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell',
  'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher', 'Lucas', 'Patterson',
  'Alexander', 'Hamilton', 'Graham', 'Reynolds', 'Griffin', 'Wallace', 'Moreno', 'West',
  'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson', 'Ellis', 'Tran', 'Medina',
  'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro', 'Marshall', 'Owens', 'Harrison',
  'Fernandez', 'Mcdonald', 'Woods', 'Washington', 'Kennedy', 'Wells', 'Vargas', 'Henry',
  'Chen', 'Freeman', 'Webb', 'Tucker', 'Guzman', 'Burns', 'Crawford', 'Olson',
  'Simpson', 'Porter', 'Hunter', 'Gordon', 'Mendez', 'Silva', 'Shaw', 'Snyder',
  'Mason', 'Dixon', 'Munoz', 'Hunt', 'Hicks', 'Holmes', 'Palmer', 'Wagner',
  'Black', 'Robertson', 'Boyd', 'Rose', 'Stone', 'Salazar', 'Fox', 'Warren',
  'Mills', 'Meyer', 'Rice', 'Schmidt', 'Garza', 'Daniels', 'Ferguson', 'Nichols',
  'Stephens', 'Soto', 'Weaver', 'Ryan', 'Gardner', 'Payne', 'Grant', 'Dunn',
  'Kelley', 'Spencer', 'Hawkins', 'Arnold', 'Pierce', 'Vazquez', 'Hansen', 'Peters',
  'Santos', 'Hart', 'Bradley', 'Knight', 'Elliott', 'Cunningham', 'Duncan', 'Armstrong',
  'Hudson', 'Carroll', 'Lane', 'Riley', 'Andrews', 'Alvarado', 'Ray', 'Delgado',
  'Berry', 'Perkins', 'Hoffman', 'Johnston', 'Matthews', 'Pena', 'Richards', 'Contreras',
  'Willis', 'Carpenter', 'Lawrence', 'Sandoval', 'Guerrero', 'George', 'Chapman', 'Rios',
  'Estrada', 'Ortega', 'Watkins', 'Greene', 'Nunez', 'Wheeler', 'Valdez', 'Harper',
];

const cities = [
  'Cairo', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
  'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco',
  'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville', 'Detroit',
  'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
  'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs',
  'Raleigh', 'Miami', 'Long Beach', 'Virginia Beach', 'Oakland', 'Minneapolis', 'Tulsa', 'Tampa',
  'New Orleans', 'Cleveland', 'Wichita', 'Arlington', 'Bakersfield', 'Tampa', 'Aurora', 'Honolulu',
  'Anaheim', 'Santa Ana', 'St. Louis', 'Riverside', 'Corpus Christi', 'Lexington', 'Pittsburgh', 'Anchorage',
  'Stockton', 'Cincinnati', 'St. Paul', 'Toledo', 'Greensboro', 'Newark', 'Plano', 'Henderson',
  'Lincoln', 'Buffalo', 'Jersey City', 'Chula Vista', 'Fort Wayne', 'Orlando', 'St. Petersburg', 'Chandler',
  'Laredo', 'Norfolk', 'Durham', 'Madison', 'Lubbock', 'Irvine', 'Winston-Salem', 'Glendale',
  'Garland', 'Hialeah', 'Reno', 'Chesapeake', 'Gilbert', 'Baton Rouge', 'Irving', 'Scottsdale',
  'North Las Vegas', 'Fremont', 'Boise', 'Richmond', 'San Bernardino', 'Birmingham', 'Spokane', 'Rochester',
  'Des Moines', 'Modesto', 'Fayetteville', 'Tacoma', 'Oxnard', 'Fontana', 'Columbus', 'Montgomery',
  'Moreno Valley', 'Shreveport', 'Aurora', 'Yonkers', 'Akron', 'Huntington Beach', 'Little Rock', 'Augusta',
  'Amarillo', 'Glendale', 'Mobile', 'Grand Rapids', 'Salt Lake City', 'Tallahassee', 'Huntsville', 'Grand Prairie',
  'Knoxville', 'Worcester', 'Newport News', 'Brownsville', 'Overland Park', 'Santa Clarita', 'Providence', 'Garden Grove',
  'Chattanooga', 'Oceanside', 'Jackson', 'Fort Lauderdale', 'Santa Rosa', 'Rancho Cucamonga', 'Port St. Lucie', 'Tempe',
  'Ontario', 'Vancouver', 'Sioux Falls', 'Peoria', 'Springfield', 'Pembroke Pines', 'Elk Grove', 'Salem',
  'Lancaster', 'Corona', 'Eugene', 'Palmdale', 'Salinas', 'Springfield', 'Pasadena', 'Fort Collins',
  'Hayward', 'Pomona', 'Cary', 'Rockford', 'Alexandria', 'Escondido', 'McKinney', 'Joliet',
  'Kansas City', 'Sunnyvale', 'Torrance', 'Bridgeport', 'Lakewood', 'Hollywood', 'Paterson', 'Naperville',
  'Syracuse', 'Mesquite', 'Dayton', 'Savannah', 'Clarksville', 'Orange', 'Pasadena', 'Fullerton',
  'Killeen', 'Frisco', 'Hampton', 'McAllen', 'Warren', 'Bellevue', 'West Valley City', 'Columbia',
  'Olathe', 'Sterling Heights', 'New Haven', 'Miramar', 'Waco', 'Thousand Oaks', 'Cedar Rapids', 'Charleston',
  'Visalia', 'Topeka', 'Elizabeth', 'Gainesville', 'Thornton', 'Roseville', 'Carrollton', 'Coral Springs',
  'Stamford', 'Simi Valley', 'Concord', 'Hartford', 'Kent', 'Lafayette', 'Midland', 'Surprise',
  'Denton', 'Victorville', 'Evansville', 'Santa Clara', 'Abilene', 'Athens', 'Vallejo', 'Allentown',
  'Norman', 'Beaumont', 'Independence', 'Murfreesboro', 'Ann Arbor', 'Springfield', 'Berkeley', 'Peoria',
  'Provo', 'El Monte', 'Columbia', 'Lansing', 'Fargo', 'Downey', 'Costa Mesa', 'Wilmington',
  'Arvada', 'Inglewood', 'Miami Gardens', 'Carlsbad', 'Westminster', 'Rochester', 'Odessa', 'Manchester',
  'Elgin', 'West Jordan', 'Round Rock', 'Clearwater', 'Waterbury', 'Gresham', 'Fairfield', 'Billings',
  'Lowell', 'San Buenaventura', 'Pueblo', 'High Point', 'West Covina', 'Richmond', 'Murrieta', 'Cambridge',
  'Antioch', 'Temecula', 'Norwalk', 'Centennial', 'Everett', 'Palm Bay', 'Wichita Falls', 'Green Bay',
  'Daly City', 'Burbank', 'Richardson', 'Pompano Beach', 'North Charleston', 'Broken Arrow', 'Boulder', 'West Palm Beach',
  'Santa Maria', 'El Cajon', 'Davenport', 'Rialto', 'Las Cruces', 'San Mateo', 'Lewisville', 'South Bend',
  'Lakeland', 'Erie', 'Tyler', 'Pearland', 'College Station', 'Kenosha', 'Sandy Springs', 'Roanoke',
  'Southaven', 'Brockton', 'Portsmouth', 'Bend', 'Edinburg', 'Yakima', 'Spokane Valley', 'Concord',
  'Layton', 'Renton', 'Mission', 'Kennewick', 'Boca Raton', 'Fort Myers', 'Lynn', 'Santa Monica',
  'Roswell', 'Albany', 'Vacaville', 'Tuscaloosa', 'Meridian', 'Orem', 'Fargo', 'Norfolk',
  'Bellingham', 'Greenville', 'Boulder', 'Wichita', 'Fresno', 'Reno', 'Tucson', 'Albuquerque',
  'Omaha', 'Minneapolis', 'Tulsa', 'Tampa', 'New Orleans', 'Cleveland', 'Wichita', 'Arlington',
];

const bioTemplates = [
  'Passionate about technology and innovation. Always learning something new.',
  'Love traveling and exploring new cultures. Food enthusiast and coffee lover.',
  'Fitness enthusiast and outdoor adventurer. Living life to the fullest.',
  'Creative professional with a passion for design and art.',
  'Tech entrepreneur building the future. Always open to new opportunities.',
  'Music lover and amateur photographer. Capturing life\'s beautiful moments.',
  'Bookworm and writer. Sharing stories and experiences.',
  'Sports fan and team player. Always up for a game.',
  'Nature enthusiast and environmental advocate. Making a difference.',
  'Foodie and home chef. Cooking is my therapy.',
  'Fitness coach and wellness advocate. Helping others achieve their goals.',
  'Digital nomad exploring the world one city at a time.',
  'Artist and creative soul. Expressing myself through various mediums.',
  'Entrepreneur and startup enthusiast. Building something meaningful.',
  'Yoga instructor and mindfulness practitioner. Finding balance in life.',
  'Gamer and tech geek. Always up for the latest releases.',
  'Photographer and visual storyteller. Every picture tells a story.',
  'Writer and content creator. Words have power.',
  'Musician and music producer. Creating sounds that move people.',
  'Fashion enthusiast and style blogger. Expressing myself through fashion.',
  'Pet lover and animal advocate. Our furry friends deserve the best.',
  'Adventure seeker and thrill enthusiast. Life is an adventure.',
  'Educator and lifelong learner. Knowledge is power.',
  'Healthcare professional dedicated to helping others.',
  'Engineer solving complex problems. Building a better tomorrow.',
  'Marketing professional connecting brands with audiences.',
  'Finance expert helping people achieve financial freedom.',
  'Lawyer fighting for justice and equality.',
  'Architect designing spaces that inspire.',
  'Chef creating culinary experiences that delight.',
];

const websiteDomains = [
  'personal.com', 'portfolio.net', 'blog.io', 'website.me', 'profile.co',
  'mysite.org', 'homepage.dev', 'site.app', 'web.space', 'page.link',
];

// Developer accounts data
interface DeveloperAccount {
  name: string;
  email: string;
  password: string;
}

const developerAccounts: DeveloperAccount[] = [
  {
    name: 'Ziad Hamdy',
    email: 'ziadhamdy667@gmail.com',
    password: 'Password#1',
  },
  {
    name: 'Ziad',
    email: 'ziad.fathi.seleem@gmail.com',
    password: 'Ziad@123',
  },
  {
    name: 'Zack River',
    email: 'zackriver.dev@gmail.com',
    password: '*A01201024880z#',
  },
  // Add more developers here in the future
];

// Helper functions
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}@example.com`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}${index}@example.com`,
    `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}${index}@example.com`,
  ];
  return getRandomElement(variations);
}

function generatePhoneNumber(): string {
  const formats = [
    `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
  ];
  return getRandomElement(formats);
}

function generateDateOfBirth(): Date {
  const now = new Date();
  const minAge = 18;
  const maxAge = 80;
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const year = now.getFullYear() - age;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

function generateWebsite(name: string): string | null {
  if (Math.random() > 0.6) {
    return `https://${name.toLowerCase().replace(/\s+/g, '')}.${getRandomElement(websiteDomains)}`;
  }
  return null;
}

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async function createUserNode(
  session: any,
  userId: string,
  name: string | null,
  username: string,
  location: string | null,
  coverPhoto: string | null,
): Promise<void> {
  await session.run(
    `MERGE (u:User {userId: $userId})
     SET u.id = $userId, u.name = $name, u.username = $username, u.location = $location, u.coverPhoto = $coverPhoto, u.updatedAt = datetime()`,
    {
      userId,
      name: name ?? null,
      username,
      location: location ?? null,
      coverPhoto: coverPhoto ?? null,
    },
  );
}

async function createUsersAndProfiles(batchSize: number = 100) {
  const totalUsers = 1000;
  const neo4jSession = neo4jDriver.session();
  
  try {
    console.log(`\n🌱 Starting seed: Creating ${totalUsers} users with profiles and Neo4j nodes...\n`);

    for (let i = 0; i < totalUsers; i += batchSize) {
      const currentBatch = Math.min(batchSize, totalUsers - i);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(totalUsers / batchSize);
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${currentBatch} users)...`);

      const usersData: any[] = [];
      
      for (let j = 0; j < currentBatch; j++) {
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        const name = `${firstName} ${lastName}`;
        const email = generateEmail(firstName, lastName, i + j);
        const location = getRandomElement(cities);
        const bio = getRandomElement(bioTemplates);
        const website = generateWebsite(name);
        const phoneNumber = Math.random() > 0.5 ? generatePhoneNumber() : null;
        const dateOfBirth = generateDateOfBirth();
        const coverPhoto = Math.random() > 0.7 ? `https://picsum.photos/1200/400?random=${i + j}` : null;
        const password = await hashPassword('password123');

        usersData.push({
          email,
          name,
          password,
          emailVerified: true,
          active: true,
          Profile: {
            create: {
              bio,
              location,
              website,
              phoneNumber,
              dateOfBirth,
              coverPhoto,
              privacySettings: {
                create: {
                  profileVisibility: 'PUBLIC' as VisibilityType,
                  postsVisibility: 'PUBLIC' as VisibilityType,
                  friendsVisibility: 'PUBLIC' as VisibilityType,
                  bioVisibility: 'PUBLIC' as VisibilityType,
                  emailVisibility: 'PRIVATE' as VisibilityType,
                  phoneVisibility: 'PRIVATE' as VisibilityType,
                  locationVisibility: 'PUBLIC' as VisibilityType,
                  dateOfBirthVisibility: 'FRIENDS' as VisibilityType,
                  whoCanSendFriendRequests: 'EVERYONE' as VisibilityType,
                  whoCanMessageMe: 'FRIENDS' as VisibilityType,
                },
              },
            },
          },
        });
      }

      // Create users in batch with retry logic and concurrency limit
      // Process in smaller chunks to avoid overwhelming the connection pool
      const concurrencyLimit = 10; // Process 10 users at a time
      const createdUsers: any[] = [];
      
      for (let chunkStart = 0; chunkStart < usersData.length; chunkStart += concurrencyLimit) {
        const chunk = usersData.slice(chunkStart, chunkStart + concurrencyLimit);
        
        const chunkResults = await Promise.all(
          chunk.map(async (userData) => {
            const maxRetries = 3;
            const baseDelay = 1000;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                return await prisma.user.create({
                  data: userData,
                  include: {
                    Profile: true,
                  },
                });
              } catch (error: any) {
                // If it's a connection error and we have retries left, retry
                if (error.code === 'P1001' && attempt < maxRetries) {
                  const delay = baseDelay * Math.pow(2, attempt - 1);
                  console.log(`  ⚠️  Retrying user creation (attempt ${attempt}/${maxRetries}) after ${delay}ms...`);
                  await new Promise((resolve) => setTimeout(resolve, delay));
                  continue;
                }
                // For other errors or last attempt, throw
                throw error;
              }
            }
            // This should never be reached, but TypeScript needs it
            throw new Error('Failed to create user after all retries');
          }),
        );
        
        createdUsers.push(...chunkResults);
        
        // Small delay between chunks to avoid overwhelming the database
        if (chunkStart + concurrencyLimit < usersData.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Create Neo4j nodes for each user
      for (const user of createdUsers) {
        if (user.Profile) {
          await createUserNode(
            neo4jSession,
            user.id,
            user.name,
            user.email,
            user.Profile.location,
            user.Profile.coverPhoto,
          );
        }
      }

      console.log(`✅ Batch ${batchNumber}/${totalBatches} completed: ${i + currentBatch}/${totalUsers} users created\n`);
    }

    console.log(`\n🎉 Successfully created ${totalUsers} users with profiles and Neo4j nodes!\n`);
    
    console.log('✨ Regular users seed completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await neo4jSession.close();
  }
}

async function createDeveloperAccounts(neo4jSession: any): Promise<string[]> {
  const developerIds: string[] = [];
  
  try {
    console.log(`\n👨‍💻 Creating ${developerAccounts.length} developer account(s)...\n`);

    for (const dev of developerAccounts) {
      console.log(`Creating developer: ${dev.name} (${dev.email})...`);

      // Generate random profile data
      const location = getRandomElement(cities);
      const bio = getRandomElement(bioTemplates);
      const website = generateWebsite(dev.name);
      const phoneNumber = Math.random() > 0.5 ? generatePhoneNumber() : null;
      const dateOfBirth = generateDateOfBirth();
      const coverPhoto = Math.random() > 0.7 ? `https://picsum.photos/1200/400?random=dev-${dev.email}` : null;
      const password = await hashPassword(dev.password);

      // Create developer user with profile
      const developer = await prisma.user.create({
        data: {
          email: dev.email,
          name: dev.name,
          password,
          emailVerified: true,
          active: true,
          Profile: {
            create: {
              bio,
              location,
              website,
              phoneNumber,
              dateOfBirth,
              coverPhoto,
              privacySettings: {
                create: {
                  profileVisibility: 'PUBLIC' as VisibilityType,
                  postsVisibility: 'PUBLIC' as VisibilityType,
                  friendsVisibility: 'PUBLIC' as VisibilityType,
                  bioVisibility: 'PUBLIC' as VisibilityType,
                  emailVisibility: 'PRIVATE' as VisibilityType,
                  phoneVisibility: 'PRIVATE' as VisibilityType,
                  locationVisibility: 'PUBLIC' as VisibilityType,
                  dateOfBirthVisibility: 'FRIENDS' as VisibilityType,
                  whoCanSendFriendRequests: 'EVERYONE' as VisibilityType,
                  whoCanMessageMe: 'FRIENDS' as VisibilityType,
                },
              },
            },
          },
        },
        include: {
          Profile: true,
        },
      });

      // Create Neo4j node for developer
      if (developer.Profile) {
        await createUserNode(
          neo4jSession,
          developer.id,
          developer.name,
          developer.email,
          developer.Profile.location,
          developer.Profile.coverPhoto,
        );
      }

      developerIds.push(developer.id);
      console.log(`✅ Created developer: ${dev.name}\n`);
    }

    console.log(`🎉 Successfully created ${developerAccounts.length} developer account(s)!\n`);
    return developerIds;
  } catch (error) {
    console.error('❌ Error creating developer accounts:', error);
    throw error;
  }
}

async function createDeveloperRelationships(
  session: any,
  developerIds: string[],
  allUserIds: string[],
) {
  if (developerIds.length === 0 || allUserIds.length === 0) {
    console.log('⚠️  No developers or users found for relationship creation\n');
    return;
  }

  // Filter out developer IDs from all user IDs
  const regularUserIds = allUserIds.filter((id) => !developerIds.includes(id));

  if (regularUserIds.length === 0) {
    console.log('⚠️  No regular users found for developer relationships\n');
    return;
  }

  console.log(`🔗 Creating extensive relationships for ${developerIds.length} developer(s)...\n`);

  for (const developerId of developerIds) {
    console.log(`Creating relationships for developer: ${developerId}...`);

    // Calculate relationship counts (using high percentages for developers)
    const followingCount = Math.min(Math.floor(regularUserIds.length * 0.6), 400); // Follow 60% of users, max 400
    const followersCount = Math.min(Math.floor(regularUserIds.length * 0.5), 350); // 50% follow back, max 350
    const friendsCount = Math.min(Math.floor(regularUserIds.length * 0.3), 150); // 30% are friends, max 150
    const sentFriendRequestsCount = Math.min(Math.floor(regularUserIds.length * 0.2), 100); // 20% sent requests, max 100
    const receivedFriendRequestsCount = Math.min(Math.floor(regularUserIds.length * 0.25), 120); // 25% received requests, max 120

    // Get random users for each relationship type
    const shuffledUsers = [...regularUserIds].sort(() => 0.5 - Math.random());

    // 1. Create FOLLOW relationships (developer following others)
    const usersToFollow = shuffledUsers.slice(0, followingCount);
    let followingCreated = 0;
    for (const userId of usersToFollow) {
      try {
        await session.run(
          `MATCH (dev:User {userId: $developerId})
           MATCH (user:User {userId: $userId})
           MERGE (dev)-[r:FOLLOWS]->(user)
           SET r.createdAt = datetime()`,
          { developerId, userId },
        );
        followingCreated++;
      } catch (error) {
        // Ignore errors
      }
    }
    console.log(`  ✅ Created ${followingCreated} FOLLOW relationships (developer following others)`);

    // 2. Create FOLLOW relationships (others following developer)
    const usersFollowingDev = shuffledUsers.slice(followingCount, followingCount + followersCount);
    let followersCreated = 0;
    for (const userId of usersFollowingDev) {
      try {
        await session.run(
          `MATCH (user:User {userId: $userId})
           MATCH (dev:User {userId: $developerId})
           MERGE (user)-[r:FOLLOWS]->(dev)
           SET r.createdAt = datetime()`,
          { userId, developerId },
        );
        followersCreated++;
      } catch (error) {
        // Ignore errors
      }
    }
    console.log(`  ✅ Created ${followersCreated} FOLLOW relationships (others following developer)`);

    // 3. Create FRIEND relationships (bidirectional)
    const usersToFriend = shuffledUsers.slice(
      followingCount + followersCount,
      followingCount + followersCount + friendsCount,
    );
    let friendsCreated = 0;
    for (const userId of usersToFriend) {
      try {
        await session.run(
          `MATCH (dev:User {userId: $developerId})
           MATCH (user:User {userId: $userId})
           MERGE (dev)-[:FRIENDS {createdAt: datetime()}]->(user)
           MERGE (user)-[:FRIENDS {createdAt: datetime()}]->(dev)`,
          { developerId, userId },
        );
        friendsCreated++;
      } catch (error) {
        // Ignore errors
      }
    }
    console.log(`  ✅ Created ${friendsCreated} FRIEND relationships (bidirectional)`);

    // 4. Create FRIEND_REQUEST relationships (developer sending requests)
    // Get users that are not already friends
    const usersNotFriends = shuffledUsers.filter((id) => !usersToFriend.includes(id));
    const usersToRequest = usersNotFriends.slice(0, sentFriendRequestsCount);
    let sentRequestsCreated = 0;
    for (const userId of usersToRequest) {
      try {
        await session.run(
          `MATCH (dev:User {userId: $developerId})
           MATCH (user:User {userId: $userId})
           WHERE NOT (dev)-[:FRIENDS]-(user)
           MERGE (dev)-[r:FRIEND_REQUEST]->(user)
           SET r.createdAt = datetime()`,
          { developerId, userId },
        );
        sentRequestsCreated++;
      } catch (error) {
        // Ignore errors
      }
    }
    console.log(`  ✅ Created ${sentRequestsCreated} FRIEND_REQUEST relationships (developer sent)`);

    // 5. Create FRIEND_REQUEST relationships (others sending requests to developer)
    // Get users that are not already friends and not in the sent requests list
    const usersNotFriendsOrRequested = usersNotFriends.filter((id) => !usersToRequest.includes(id));
    const usersRequestingDev = usersNotFriendsOrRequested.slice(0, receivedFriendRequestsCount);
    let receivedRequestsCreated = 0;
    for (const userId of usersRequestingDev) {
      try {
        await session.run(
          `MATCH (user:User {userId: $userId})
           MATCH (dev:User {userId: $developerId})
           WHERE NOT (user)-[:FRIENDS]-(dev)
           MERGE (user)-[r:FRIEND_REQUEST]->(dev)
           SET r.createdAt = datetime()`,
          { userId, developerId },
        );
        receivedRequestsCreated++;
      } catch (error) {
        // Ignore errors
      }
    }
    console.log(`  ✅ Created ${receivedRequestsCreated} FRIEND_REQUEST relationships (developer received)`);

    console.log(`✅ Completed relationships for developer: ${developerId}\n`);
  }

  console.log(`🎉 Successfully created extensive relationships for all developers!\n`);
}

async function createRelationships(session: any, totalUsers: number) {
  // Get all user IDs from database
  const allUsers = await prisma.user.findMany({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  
  if (allUsers.length === 0) {
    console.log('⚠️  No users found to create relationships\n');
    return;
  }
  
  // Create friend relationships (bidirectional)
  const friendPairs = Math.min(Math.floor(totalUsers * 0.1), Math.floor(allUsers.length * 0.1)); // 10% of users will have friends
  console.log(`Creating ${friendPairs} friend relationships...`);
  
  const friendRelationships = new Set<string>();
  
  for (let i = 0; i < friendPairs; i++) {
    let user1, user2;
    let attempts = 0;
    
    // Ensure we get two different users and avoid duplicates
    do {
      user1 = getRandomElement(allUsers);
      user2 = getRandomElement(allUsers);
      attempts++;
    } while ((user1.id === user2.id || friendRelationships.has(`${user1.id}-${user2.id}`) || friendRelationships.has(`${user2.id}-${user1.id}`)) && attempts < 100);
    
    if (user1.id === user2.id) continue;
    
    const relationshipKey = `${user1.id}-${user2.id}`;
    if (friendRelationships.has(relationshipKey) || friendRelationships.has(`${user2.id}-${user1.id}`)) {
      continue;
    }
    
    friendRelationships.add(relationshipKey);
    
    try {
      await session.run(
        `MATCH (u1:User {userId: $userId1})
         MATCH (u2:User {userId: $userId2})
         MERGE (u1)-[:FRIENDS {createdAt: datetime()}]->(u2)
         MERGE (u2)-[:FRIENDS {createdAt: datetime()}]->(u1)`,
        { userId1: user1.id, userId2: user2.id },
      );
    } catch (error) {
      // Ignore errors for missing nodes
    }
    
    if ((i + 1) % 100 === 0) {
      console.log(`  Created ${i + 1}/${friendPairs} friend relationships...`);
    }
  }
  
  console.log(`✅ Created friend relationships\n`);
  
  // Create follow relationships (unidirectional)
  const followCount = Math.min(Math.floor(totalUsers * 0.3), Math.floor(allUsers.length * 0.3)); // 30% of users will follow others
  console.log(`Creating ${followCount} follow relationships...`);
  
  const followRelationships = new Set<string>();
  
  for (let i = 0; i < followCount; i++) {
    let follower, followee;
    let attempts = 0;
    
    do {
      follower = getRandomElement(allUsers);
      followee = getRandomElement(allUsers);
      attempts++;
    } while ((follower.id === followee.id || followRelationships.has(`${follower.id}-${followee.id}`)) && attempts < 100);
    
    if (follower.id === followee.id) continue;
    
    const relationshipKey = `${follower.id}-${followee.id}`;
    if (followRelationships.has(relationshipKey)) {
      continue;
    }
    
    followRelationships.add(relationshipKey);
    
    try {
      await session.run(
        `MATCH (follower:User {userId: $followerId})
         MATCH (followee:User {userId: $followeeId})
         MERGE (follower)-[r:FOLLOWS]->(followee)
         SET r.createdAt = datetime()`,
        { followerId: follower.id, followeeId: followee.id },
      );
    } catch (error) {
      // Ignore errors for missing nodes
    }
    
    if ((i + 1) % 100 === 0) {
      console.log(`  Created ${i + 1}/${followCount} follow relationships...`);
    }
  }
  
  console.log(`✅ Created follow relationships\n`);
}

async function syncAllPostsToNeo4jFromPrisma() {
  const session = neo4jDriver.session();

  try {
    console.log('🔄 Syncing posts from PostgreSQL to Neo4j...');

    const batchSize = 1000;
    let skip = 0;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore) {
      const posts = await prisma.post.findMany({
        select: {
          id: true,
          authorId: true,
          createdAt: true,
          isDeleted: true,
        },
        skip,
        take: batchSize,
        orderBy: { createdAt: 'asc' },
      });

      if (!posts.length) {
        hasMore = false;
        break;
      }

      const activePosts = posts.filter((p) => !p.isDeleted);

      if (activePosts.length) {
        await session.run(
          `
          UNWIND $posts as postData
          MERGE (post:Post {id: postData.id})
          SET post.createdAt = datetime(postData.createdAt)

          WITH post, postData
          MATCH (author:User {id: postData.authorId})
          MERGE (author)-[:POSTED]->(post)
        `,
          {
            posts: activePosts.map((p) => ({
              id: p.id,
              authorId: p.authorId,
              createdAt: p.createdAt.toISOString(),
            })),
          },
        );

        totalSynced += activePosts.length;
        console.log(`  ✅ Synced ${totalSynced} posts into Neo4j so far...`);
      }

      skip += batchSize;
    }

    console.log(`✨ Finished syncing ${totalSynced} posts into Neo4j.\n`);
  } catch (error) {
    console.error('❌ Error syncing posts to Neo4j:', error);
    throw error;
  } finally {
    await session.close();
  }
}

async function clearNeo4j() {
  const session = neo4jDriver.session();
  try {
    console.log('🗑️  Clearing Neo4j database...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('✅ Neo4j database cleared\n');
  } catch (error) {
    console.error('❌ Error clearing Neo4j:', error);
    throw error;
  } finally {
    await session.close();
  }
}

async function clearPostgreSQL() {
  try {
    console.log('🗑️  Clearing PostgreSQL database...');
    
    // Delete in correct order to respect foreign key constraints
    await prisma.profilePrivacy.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.otp.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('✅ PostgreSQL database cleared\n');
  } catch (error) {
    console.error('❌ Error clearing PostgreSQL:', error);
    throw error;
  }
}

async function main() {
  let neo4jConnected = false;
  
  try {
    console.log('🚀 Starting database seed...\n');
    
    // Initialize Neo4j with retry logic
    console.log('📡 Connecting to Neo4j...');
    try {
      initNeo4j();
      await neo4jDriver.verifyConnectivity();
      console.log('✅ Neo4j connected\n');
      neo4jConnected = true;
    } catch (error) {
      console.error('⚠️  Failed to connect to Neo4j:', error.message);
      console.log('💡 Tip: Make sure Neo4j is running and accessible.');
      console.log('   If running in Docker, ensure the container is up: docker-compose up neo4j\n');
      throw error;
    }
    
    // Connect to Prisma with retry logic
    console.log('📡 Connecting to PostgreSQL...');
    const maxRetries = 5;
    const baseDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await prisma.$connect();
        // Small delay to ensure connection is stable
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log('✅ PostgreSQL connected\n');
        break;
      } catch (error: any) {
        if (attempt === maxRetries) {
          console.error(`❌ Failed to connect to PostgreSQL after ${maxRetries} attempts`);
          console.error(`   Error: ${error.message}`);
          if (error.code === 'P1001') {
            console.log('💡 Connection Error (P1001): Cannot reach database server');
            console.log('   - If using Neon: The database might be sleeping. Try accessing it first to wake it up.');
            console.log('   - If using Docker: Ensure the postgres container is running: docker-compose ps');
            console.log('   - Check your DATABASE_URL environment variable is correct');
          } else {
            console.log('💡 Tip: Make sure your database server is running and accessible.');
            console.log('   Check your DATABASE_URL environment variable and network connectivity.');
          }
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⚠️  Connection attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    
    // Clear existing data
    if (neo4jConnected) {
      await clearNeo4j();
    }
    await clearPostgreSQL();
    
    // Create developer accounts first
    const neo4jSession = neo4jDriver.session();
    let developerIds: string[] = [];
    try {
      developerIds = await createDeveloperAccounts(neo4jSession);
    } finally {
      await neo4jSession.close();
    }
    
    // Create regular users and profiles
    await createUsersAndProfiles(100);
    
    // Get all user IDs (including developers)
    const allUsers = await prisma.user.findMany({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    const allUserIds = allUsers.map((u) => u.id);

    // Create posts for all users
    await seedPostsForUsers(prisma, allUserIds);

    // Sync all posts into Neo4j graph
    if (neo4jConnected) {
      await syncAllPostsToNeo4jFromPrisma();
    }

    // Create relationships for regular users
    const regularSession = neo4jDriver.session();
    try {
      console.log('🔗 Creating relationships for regular users (friends and follows)...\n');
      await createRelationships(regularSession, allUserIds.length);
    } finally {
      await regularSession.close();
    }
    
    // Create extensive relationships for developers
    if (developerIds.length > 0 && allUserIds.length > developerIds.length) {
      const devSession = neo4jDriver.session();
      try {
        await createDeveloperRelationships(devSession, developerIds, allUserIds);
      } finally {
        await devSession.close();
      }
    }
    
    console.log('✨ Seed completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    if (neo4jDriver) {
      await neo4jDriver.close();
    }
    console.log('👋 Connections closed\n');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

