# Docker Compose Usage Guide

This project uses a multi-file Docker Compose setup to support both development and production environments.

## 📁 File Structure

- **`docker-compose.yml`** - Base configuration shared across all environments
- **`docker-compose.override.yml`** - Development environment (auto-loaded)
- **`docker-compose.prod.yml`** - Production environment
- **`docker-compose.dev.yml`** - Legacy dev file (kept for reference)

## 🚀 Quick Start

### Development Mode (Default)

```bash
# Start all services in development mode
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The `docker-compose.override.yml` file is automatically loaded when you run `docker-compose up`, providing:
- Hot-reloading for the backend
- Prisma Studio on port 5555
- Volume mounting for live code changes

### Production Mode

```bash
# Start all services in production mode
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## 🔧 Services

### Core Services (All Environments)
- **PostgreSQL** (port 5432) - Primary database
- **Neo4j** (ports 7474, 7687) - Graph database
- **Redis** (port 6379) - Caching layer
- **Backend** (port 3000) - NestJS application

### Development Only
- **Prisma Studio** (port 5555) - Database management UI

### Production Only
- **Nginx** (ports 80, 443) - Reverse proxy and load balancer

## 📝 Environment Variables

Make sure to set up your `.env` file before running. Key variables:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=ding_db
POSTGRES_PORT=5432

# Neo4j
NEO4J_AUTH=neo4j/yourpassword
NEO4J_PASSWORD=yourpassword

# Redis (Production)
REDIS_PASSWORD=yourredispassword

# Application
PORT=3000
NODE_ENV=development  # or production
```

## 🛠️ Common Commands

### Rebuild Services
```bash
# Development
docker-compose build
docker-compose up --build

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### View Service Status
```bash
docker-compose ps
```

### Execute Commands in Containers
```bash
# Access backend shell
docker-compose exec backend sh

# Run Prisma migrations
docker-compose exec backend pnpm prisma migrate dev

# View backend logs
docker-compose logs -f backend
```

### Clean Up
```bash
# Stop and remove containers, networks
docker-compose down

# Also remove volumes (⚠️ deletes all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 🏗️ Production Deployment

### Prerequisites
1. Set `NODE_ENV=production` in your `.env` file
2. Set strong passwords for all services
3. Configure SSL certificates in `nginx/ssl/` directory
4. Update `nginx/conf.d/default.conf` with your domain

### Deploy Steps
```bash
# 1. Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# 2. Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. Run database migrations
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 4. Check health
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

## 🔍 Healthchecks

All services include healthchecks:
- **PostgreSQL**: `pg_isready`
- **Neo4j**: Cypher shell query
- **Redis**: `redis-cli ping`
- **Backend** (prod): HTTP health endpoint

## 📊 Resource Limits (Production)

Production services have resource limits:
- **PostgreSQL**: 2 CPU, 2GB RAM
- **Neo4j**: 2 CPU, 4GB RAM
- **Redis**: 1 CPU, 512MB RAM
- **Backend**: 2 CPU, 2GB RAM

## 🐛 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs postgres
```

### Database connection issues
```bash
# Verify PostgreSQL is healthy
docker-compose exec postgres pg_isready -U postgres

# Check Neo4j status
docker-compose exec neo4j cypher-shell -u neo4j -p yourpassword "RETURN 1"
```

### Reset everything
```bash
docker-compose down -v
docker-compose up --build
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Documentation](https://docs.nestjs.com/recipes/docker-compose)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Neo4j Docker Documentation](https://neo4j.com/docs/operations-manual/current/docker/)

## 🔐 Security Notes

### Development
- Default passwords are acceptable
- Services exposed on localhost
- Debug mode enabled

### Production
- **Use strong, unique passwords**
- Configure SSL/TLS for all services
- Enable firewall rules
- Regular security updates
- Monitor logs for suspicious activity
