# Docker Compose Setup - Complete Guide

## 📋 Overview

The Ding Platform Backend now uses a **unified Docker Compose structure** that supports both **development** and **production** environments through a multi-file approach.

## 🗂️ File Structure

```
Ding-Platform-Backend/
├── docker-compose.yml              # Base configuration (shared)
├── docker-compose.override.yml     # Development overrides (auto-loaded)
├── docker-compose.prod.yml         # Production configuration
├── docker-compose.dev.yml          # Legacy dev file (for reference)
├── docker-dev.sh                   # Development helper script
├── docker-prod.sh                  # Production helper script
├── Dockerfile                      # Production Dockerfile
├── Dockerfile.dev                  # Development Dockerfile
├── nginx/
│   ├── nginx.conf                  # Main nginx config
│   ├── conf.d/
│   │   └── default.conf           # Server configuration
│   └── ssl/
│       └── README.md              # SSL setup instructions
└── DOCKER_GUIDE.md                # Detailed usage guide
```

## 🚀 Quick Start

### Development

```bash
# Make scripts executable (first time only)
chmod +x docker-dev.sh docker-prod.sh

# Start development environment
./docker-dev.sh start

# View logs
./docker-dev.sh logs

# Access backend shell
./docker-dev.sh shell

# Run migrations
./docker-dev.sh migrate

# Stop environment
./docker-dev.sh stop
```

**Or use docker-compose directly:**
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Production

```bash
# Full deployment (build + start + migrate)
./docker-prod.sh deploy

# Check health
./docker-prod.sh health

# View logs
./docker-prod.sh logs

# Create backup
./docker-prod.sh backup

# Stop environment
./docker-prod.sh stop
```

**Or use docker-compose directly:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## 🔧 Services

### Common Services (All Environments)

| Service    | Port(s)     | Description                    |
|------------|-------------|--------------------------------|
| postgres   | 5432        | PostgreSQL database            |
| neo4j      | 7474, 7687  | Neo4j graph database           |
| redis      | 6379        | Redis cache                    |
| backend    | 3000        | NestJS application             |

### Development Only

| Service        | Port  | Description                |
|----------------|-------|----------------------------|
| prisma-studio  | 5555  | Database management UI     |

### Production Only

| Service  | Port(s)  | Description                    |
|----------|----------|--------------------------------|
| nginx    | 80, 443  | Reverse proxy & load balancer  |

## 📊 What's New

### ✅ Added Features

1. **Redis Service** - Caching layer for improved performance
2. **Health Checks** - All services now have proper health checks
3. **Production Config** - Optimized settings with resource limits
4. **Nginx Reverse Proxy** - Production-ready proxy with SSL support
5. **Helper Scripts** - Easy-to-use management scripts
6. **Environment Separation** - Clear distinction between dev and prod

### 🔄 Changes from Old Setup

| Aspect              | Old (docker-compose.dev.yml) | New (Unified)                |
|---------------------|------------------------------|------------------------------|
| Redis               | ❌ Not included              | ✅ Included                  |
| Health Checks       | ⚠️ Basic                     | ✅ Comprehensive             |
| Port Mapping        | Custom (7475, 7688)          | Standard (7474, 7687)        |
| Neo4j Version       | `latest`                     | `5.15-community` (pinned)    |
| Postgres Image      | `postgres:15`                | `postgres:15-alpine`         |
| Restart Policy      | `always`                     | `unless-stopped` (dev)       |
| Production Support  | ❌ None                      | ✅ Full support              |
| Resource Limits     | ❌ None                      | ✅ Defined (production)      |
| SSL/TLS             | ❌ None                      | ✅ Nginx with SSL            |

### 🆕 New Environment Variables

Add these to your `.env` file:

```env
# Redis (Optional for dev, required for prod)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=yourredispassword  # Production only

# Node Environment
NODE_ENV=development  # or production

# Port (optional, defaults to 3000)
PORT=3000
```

## 📁 Service Configuration

### Development Environment

**Features:**
- Hot-reloading enabled
- Source code mounted as volumes
- Prisma Studio for database management
- Debug mode enabled
- Relaxed resource limits

**Command:**
```bash
docker-compose up
# or
./docker-dev.sh start
```

### Production Environment

**Features:**
- Optimized Docker images (multi-stage build)
- Resource limits enforced
- SSL/TLS encryption via Nginx
- Health checks and auto-restart
- Logging configuration
- No source code mounting

**Command:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# or
./docker-prod.sh deploy
```

## 🔐 Security Considerations

### Development
- Use default passwords (acceptable for local development)
- Services bound to localhost
- Debug logging enabled

### Production
- **MUST** use strong, unique passwords
- Configure SSL certificates (see `nginx/ssl/README.md`)
- Enable firewall rules
- Use environment variable secrets
- Regular security updates
- Monitor logs for suspicious activity

## 🛠️ Helper Scripts

### docker-dev.sh
- `start` - Start dev environment
- `stop` - Stop dev environment  
- `restart` - Restart services
- `logs [service]` - View logs
- `status` - Show service status
- `rebuild` - Rebuild images
- `clean` - Remove all containers/volumes
- `migrate` - Run database migrations
- `seed` - Seed database
- `shell` - Access backend shell

### docker-prod.sh
- `start` - Start prod environment
- `stop` - Stop prod environment
- `restart` - Restart services
- `logs [service]` - View logs
- `status` - Show service status
- `build` - Build production images
- `deploy` - Full deployment
- `migrate` - Run migrations
- `health` - Health check all services
- `backup` - Backup databases
- `resources` - Show resource usage

## 📈 Migration Guide

### From docker-compose.dev.yml

1. **Backup your data** (if needed):
   ```bash
   docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres ding_db > backup.sql
   ```

2. **Stop old environment**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

3. **Update .env file** with new environment variables (see above)

4. **Start new environment**:
   ```bash
   docker-compose up -d
   ```

5. **Restore data** (if needed):
   ```bash
   docker-compose exec -T postgres psql -U postgres ding_db < backup.sql
   ```

6. **Verify services**:
   ```bash
   ./docker-dev.sh status
   ./docker-dev.sh health  # Production only
   ```

## 🎯 Best Practices

1. **Always use the helper scripts** for common operations
2. **Keep .env file secure** and never commit it
3. **Use docker-compose.override.yml** for local customizations
4. **Pin service versions** in production
5. **Monitor resource usage** regularly
6. **Backup databases** before major updates
7. **Test production config** in staging first
8. **Use SSL certificates** in production

## 📚 Additional Resources

- [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) - Comprehensive usage guide
- [nginx/ssl/README.md](./nginx/ssl/README.md) - SSL setup instructions
- [.env.example](./.env.example) - Environment variables template

## 🐛 Troubleshooting

See [DOCKER_GUIDE.md](./DOCKER_GUIDE.md#-troubleshooting) for common issues and solutions.

## ✅ Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in .env
- [ ] Configure strong passwords for all services
- [ ] Set up SSL certificates in `nginx/ssl/`
- [ ] Update nginx config with your domain
- [ ] Test health checks
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts
- [ ] Test backup and restore procedures
- [ ] Review resource limits
- [ ] Update environment variables

---

**Last Updated:** December 2025  
**Version:** 2.0.0
