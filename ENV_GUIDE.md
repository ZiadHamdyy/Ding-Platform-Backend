# Ding Platform Backend - Environment Variables Guide

This document explains all environment variables used in the Ding Platform Backend.

## 📋 Table of Contents

- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Development vs Production](#development-vs-production)
- [Setup Instructions](#setup-instructions)

---

## ✅ Required Variables

These variables **must** be set for the application to run:

### Database Configuration

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/ding_platform
```
- PostgreSQL connection string
- Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
- **Production**: Use your cloud database URL (e.g., Supabase, Railway, Neon)

### JWT Configuration

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```
- Secret key for signing JWT tokens
- **Important**: Use a strong, random string in production
- Generate with: `openssl rand -base64 32`

### Cloudinary Configuration

```bash
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```
- Required for media uploads (images and videos)
- Get credentials from [Cloudinary Dashboard](https://cloudinary.com/console)

### Neo4j Configuration

```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-password
```
- Required for social graph features
- Alternative format: `NEO4J_AUTH=neo4j/password`
- **Production**: Use Neo4j Aura or cloud instance

---

## 🔧 Optional Variables

These variables have defaults but can be customized:

### Server Configuration

```bash
PORT=3000                    # Default: 3000
NODE_ENV=development         # Options: development, production, test
```

### Frontend Configuration

```bash
FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173,https://ding-gray.vercel.app
```
- Used for CORS configuration
- `FRONTEND_URLS`: Comma-separated list of allowed origins

### Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS=60000        # Default: 60000 (1 minute)
RATE_LIMIT_MAX_REQUESTS=100       # Default: 100 requests per window
```
- Only applied in production (`NODE_ENV=production`)
- Protects against API abuse

### Token Expiration

```bash
ACCESS_TOKEN_EXPIRES_IN=15m       # Default: 15 minutes
REFRESH_TOKEN_EXPIRES_IN=7d       # Default: 7 days
OTP_EXPIRES_IN_MINUTES=10         # Default: 10 minutes
```
- Access tokens: Short-lived for security
- Refresh tokens: Longer-lived, stored in HttpOnly cookies
- OTP: Email verification and password reset codes

### API Configuration

```bash
API_PREFIX=api                    # Default: api
API_DOCS_PATH=api/docs           # Default: api/docs
```
- API routes will be at `/api/*`
- Swagger docs at `/api/docs`

### Security Configuration

```bash
BCRYPT_ROUNDS=10                 # Default: 10
SESSION_SECRET=your-session-secret-key
```
- `BCRYPT_ROUNDS`: Higher = more secure but slower (10-12 recommended)
- `SESSION_SECRET`: Used for session encryption

### Email Configuration

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@ding.com
SMTP_FROM_NAME=Ding Platform
```
- Required for sending OTP emails
- Gmail: Use [App Passwords](https://support.google.com/accounts/answer/185833)
- Other providers: Use their SMTP settings

### Google OAuth (Optional)

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```
- Required only if using Google OAuth login
- Get credentials from [Google Cloud Console](https://console.cloud.google.com)

### File Upload Configuration

```bash
UPLOAD_DIR=./uploads             # Default: ./uploads
```
- Local directory for temporary file uploads
- Not used in production (Cloudinary handles uploads)

### Redis (Optional)

```bash
REDIS_URL=redis://localhost:6379
```
- Optional caching layer
- Not currently implemented but can be added

### Sentry (Optional)

```bash
SENTRY_DSN=your-sentry-dsn
```
- Optional error tracking
- Get DSN from [Sentry Dashboard](https://sentry.io)

### Vercel Deployment

```bash
VERCEL=1
```
- Automatically set by Vercel
- Enables serverless mode

---

## 🔄 Development vs Production

### Development Setup

```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/ding_dev
NEO4J_URI=bolt://localhost:7687
FRONTEND_URL=http://localhost:5173
```

### Production Setup

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@production-host:5432/ding_prod
NEO4J_URI=bolt+s://production-neo4j:7687
FRONTEND_URL=https://ding-platform.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**Key Differences:**
- ✅ Rate limiting enabled in production
- ✅ Secure database connections (SSL)
- ✅ Strong JWT secrets
- ✅ Production frontend URLs
- ✅ Error tracking (Sentry)

---

## 🚀 Setup Instructions

### 1. Copy Example File

```bash
cp .env.example .env
```

### 2. Update Required Variables

Edit `.env` and set:
- `DATABASE_URL` - Your PostgreSQL connection
- `JWT_SECRET` - Generate with `openssl rand -base64 32`
- `CLOUDINARY_*` - Your Cloudinary credentials
- `NEO4J_*` - Your Neo4j credentials

### 3. Update Optional Variables

Customize as needed:
- `PORT` - If 3000 is in use
- `FRONTEND_URL` - Your frontend URL
- `SMTP_*` - Your email provider settings

### 4. Verify Configuration

```bash
# Check if all required variables are set
pnpm run check-env  # (if script exists)

# Or manually verify
cat .env | grep -E "DATABASE_URL|JWT_SECRET|CLOUDINARY|NEO4J"
```

### 5. Start Development Server

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm start:dev
```

---

## 🔐 Security Best Practices

### ⚠️ Never Commit `.env` File

The `.env` file contains sensitive credentials and should **never** be committed to Git.

```bash
# Verify .env is in .gitignore
cat .gitignore | grep .env
```

### ✅ Use Strong Secrets

```bash
# Generate strong JWT secret
openssl rand -base64 32

# Generate strong session secret
openssl rand -base64 32
```

### ✅ Rotate Secrets Regularly

- Change `JWT_SECRET` periodically (invalidates all tokens)
- Rotate API keys every 90 days
- Update database passwords regularly

### ✅ Use Environment-Specific Values

- **Development**: Use local databases and services
- **Staging**: Use staging databases with production-like config
- **Production**: Use production databases with strict security

---

## 📝 Environment Variable Checklist

Before deploying, ensure:

- [ ] `DATABASE_URL` points to production database
- [ ] `JWT_SECRET` is a strong, random string
- [ ] `NEO4J_*` credentials are set correctly
- [ ] `CLOUDINARY_*` credentials are valid
- [ ] `FRONTEND_URL` matches your frontend domain
- [ ] `NODE_ENV=production` is set
- [ ] `RATE_LIMIT_*` values are configured
- [ ] `SMTP_*` settings are correct (for emails)
- [ ] `.env` file is **not** in version control
- [ ] Secrets are stored securely (e.g., Vercel secrets, AWS Secrets Manager)

---

## 🆘 Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql $DATABASE_URL

# Check if database exists
psql -l | grep ding
```

### Neo4j Connection Issues

```bash
# Test Neo4j connection
cypher-shell -a $NEO4J_URI -u $NEO4J_USERNAME -p $NEO4J_PASSWORD
```

### Cloudinary Upload Issues

- Verify credentials in [Cloudinary Dashboard](https://cloudinary.com/console)
- Check API key permissions
- Ensure cloud name is correct

### Email Sending Issues

- Gmail: Enable "Less secure app access" or use App Passwords
- Check SMTP host and port
- Verify firewall allows outbound SMTP connections

---

## 📚 Additional Resources

- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Neo4j Connection URIs](https://neo4j.com/docs/operations-manual/current/configuration/connectors/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Last Updated**: 2025-11-24  
**Version**: 1.0.0
