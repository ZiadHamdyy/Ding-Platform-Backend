# Ding Platform Backend

A social networking platform backend built with NestJS, featuring a hybrid database architecture with PostgreSQL and Neo4j.

## 🏗️ Architecture

- **Framework**: NestJS (Node.js)
- **Databases**: 
  - PostgreSQL (User data, posts, profiles)
  - Neo4j (Social graph, relationships)
  - Redis (Caching)
- **Authentication**: JWT + OAuth2 (Google)
- **File Storage**: Cloudinary
- **API Documentation**: Swagger/OpenAPI

## 📋 Features

### Sprint 1: Authentication & Security
- ✅ JWT-based authentication
- ✅ Google OAuth2 integration
- ✅ Password reset flow
- ✅ Rate limiting
- ✅ Session management

### Sprint 2: Post Management
- ✅ Create, read, update, delete posts
- ✅ Image uploads via Cloudinary
- ✅ Post reactions
- ✅ Comments system

### Sprint 3: Social Graph
- ✅ Follow/unfollow users
- ✅ Friend requests
- ✅ Connection management
- ✅ Neo4j-powered social graph

### Sprint 4: Feed & Privacy
- ✅ Personalized feed
- ✅ Privacy settings
- ✅ Content visibility control
- ✅ Social graph-based filtering

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose (for local development)
- PostgreSQL 15+
- Neo4j 5+
- Redis 7+

### Local Development with Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd Ding-Platform-Backend

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services
./docker-dev.sh start

# Or use docker-compose directly
docker-compose up -d

# View logs
./docker-dev.sh logs

# Access services:
# Backend: http://localhost:3000
# API Docs: http://localhost:3000/api/docs
# Prisma Studio: http://localhost:5555
# Neo4j Browser: http://localhost:7474
```

### Manual Setup (Without Docker)

```bash
# Install dependencies
pnpm install

# Setup databases (PostgreSQL, Neo4j, Redis must be running)

# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm run prisma:seed

# Start development server
pnpm run start:dev
```

## 📚 Documentation

### Deployment Guides
- **Render**: See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed Render deployment guide
- **Quick Start**: See [RENDER_QUICK_START.md](./RENDER_QUICK_START.md) for fast deployment
- **Docker**: See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for Docker configuration

### API Documentation
- **Development**: http://localhost:3000/api/docs
- **Production**: https://your-app.onrender.com/api/docs

### Project Documentation
- [ENV_GUIDE.md](./ENV_GUIDE.md) - Environment variables
- [FEED_DOCUMENTATION.md](./FEED_DOCUMENTATION.md) - Feed system
- [PROGRESS.md](./PROGRESS.md) - Project progress
- Sprint summaries in root directory

## 🛠️ Available Scripts

```bash
# Development
pnpm run start:dev          # Start with hot-reload
pnpm run start:debug        # Start in debug mode

# Production
pnpm run build              # Build application
pnpm run start:prod         # Start production server

# Database
pnpm prisma generate        # Generate Prisma Client
pnpm prisma migrate dev     # Run migrations (dev)
pnpm prisma migrate deploy  # Run migrations (prod)
pnpm prisma studio          # Open Prisma Studio
pnpm run prisma:seed        # Seed database

# Testing
pnpm run test               # Unit tests
pnpm run test:e2e           # E2E tests
pnpm run test:cov           # Test coverage

# Code Quality
pnpm run lint               # Lint code
pnpm run format             # Format code

# Docker
./docker-dev.sh start       # Start dev environment
./docker-dev.sh stop        # Stop dev environment
./docker-dev.sh logs        # View logs
./docker-dev.sh migrate     # Run migrations
./docker-dev.sh shell       # Access backend shell

./docker-prod.sh deploy     # Deploy production
./docker-prod.sh health     # Check health
./docker-prod.sh backup     # Backup databases
```

## 🌍 Deployment

### Render (Recommended)

The easiest way to deploy is using Render with the included blueprint:

1. **Setup Neo4j Aura** (free tier available)
   - Create instance at [console.neo4j.io](https://console.neo4j.io)

2. **Deploy via Blueprint**
   ```bash
   # Push to GitHub
   git push origin main
   
   # In Render dashboard:
   # - New + → Blueprint
   # - Connect repository
   # - Configure environment variables
   # - Deploy
   ```

3. **Complete guide**: See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

### Docker Production

```bash
# Build and deploy
./docker-prod.sh deploy

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Vercel (Serverless)

The application also supports Vercel deployment (see `vercel.json`).

## 🔧 Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ding_db
NEO4J_URI=bolt://localhost:7687
NEO4J_AUTH=neo4j/password
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Services
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🏛️ Project Structure

```
src/
├── common/              # Shared utilities, decorators, guards
├── configs/             # Database, Neo4j, Redis configurations
├── modules/
│   ├── auth/           # Authentication & authorization
│   ├── user/           # User management
│   ├── profile/        # User profiles
│   ├── post/           # Post management
│   ├── social/         # Social graph (follow/friend)
│   ├── feed/           # Personalized feed
│   └── privacy/        # Privacy settings
├── app.module.ts       # Root module
└── main.ts             # Application entry point

prisma/
├── schema.prisma        # Database schema
├── migrations/          # Database migrations
└── seed.ts             # Database seeding

scripts/
├── render-build.sh     # Render build script
└── render-start.sh     # Render start script
```

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Run e2e tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## 🔒 Security

- JWT-based authentication
- Bcrypt password hashing
- Rate limiting (100 req/min)
- Helmet.js security headers
- CORS configuration
- Input validation with class-validator
- SQL injection protection via Prisma
- XSS protection

## 📊 Monitoring

### Health Check
- Endpoint: `/health`
- Returns: Service status, uptime, environment

### Logging
- Development: Pretty-printed console logs
- Production: JSON logs with Pino
- Optional: Sentry integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License.

## 👥 Team

Built with ❤️ by the Ding Platform team

## 📞 Support

- Documentation: Check files in project root
- Issues: Open a GitHub issue
- Email: [Your support email]

## 🗺️ Roadmap

- [ ] Real-time notifications (WebSocket)
- [ ] Direct messaging
- [ ] Advanced search
- [ ] Analytics dashboard
- [ ] Mobile app API optimization
- [ ] GraphQL API
- [ ] Microservices architecture

---

**Ready to deploy?** Check out [RENDER_QUICK_START.md](./RENDER_QUICK_START.md) for a 5-minute deployment guide!
