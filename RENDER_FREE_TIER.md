# 🆓 Render Free Tier - Important Information

## 📋 Free Tier Specifications

### Web Service (ding-backend)
- **RAM**: 512 MB
- **CPU**: 0.1 (shared)
- **Storage**: No persistent disk
- **Network**: Shared bandwidth
- **Behavior**: **Spins down after 15 minutes of inactivity**
- **Cold start**: 30-60 seconds on first request after sleep
- **Uptime**: 750 hours/month free

### PostgreSQL (ding-postgres)
- **Storage**: 1 GB
- **Expires**: After 90 days of inactivity
- **Connections**: Limited
- **Performance**: Shared resources

### Redis (ding-redis)
- **Storage**: 25 MB
- **Performance**: Shared resources
- **Persistence**: Yes (with limitations)

---

## ⚠️ Free Tier Limitations

### 1. Service Sleeps After Inactivity
**Issue**: Backend spins down after 15 minutes without requests.

**Impact**:
- First request after sleep takes 30-60 seconds (cold start)
- Poor user experience for inactive periods
- Not suitable for real-time features

**Solutions**:
- ✅ Use a ping service to keep alive (see below)
- ✅ Show loading state on frontend during cold start
- ✅ Upgrade to Starter plan ($7/mo) for always-on

### 2. Limited Memory (512 MB)
**Issue**: NestJS + Prisma + connections can use significant memory.

**Optimizations**:
```typescript
// Already configured in your app:
- Reduced database connection pool
- Efficient memory usage
- No file uploads to disk (Cloudinary only)
```

**Tips**:
- ❌ Don't run memory-intensive tasks
- ❌ Don't store large files locally
- ✅ Use Cloudinary for all media
- ✅ Keep Redis cache small

### 3. Low CPU (0.1)
**Issue**: Slow processing for CPU-intensive tasks.

**Optimizations**:
```typescript
// Keep your code efficient:
- Minimize bcrypt rounds (set to 10)
- Use database indexes
- Cache frequently accessed data
- Avoid complex computations
```

### 4. No Persistent Disk
**Issue**: Can't store files locally.

**Solution**:
- ✅ Already configured: All uploads go to Cloudinary
- ✅ No local file storage needed

### 5. No SSH Access
**Issue**: Can't directly access container shell.

**Alternatives**:
- ✅ Use Render Shell (Dashboard → Service → Shell)
- ✅ View logs in real-time (Dashboard → Logs)
- ✅ Run migrations via startup script

### 6. PostgreSQL Expires After 90 Days
**Issue**: Database deleted if inactive for 90 days.

**Solution**:
- ✅ Make at least one request every 90 days
- ✅ Use a ping service (see below)
- ✅ Regular backups (see backup section)

---

## 🔄 Keep-Alive Solutions

### Option 1: UptimeRobot (Recommended - Free)

1. **Sign up**: https://uptimerobot.com (free tier)
2. **Add monitor**:
   - Type: HTTP(s)
   - URL: `https://your-app.onrender.com/health`
   - Interval: 5 minutes
3. **Done**: Service stays awake!

**Pros**:
- ✅ Free forever
- ✅ Email alerts on downtime
- ✅ Status page available

**Cons**:
- ⚠️  5-minute minimum interval (service may sleep briefly)

### Option 2: Cron-job.org (Free)

1. **Sign up**: https://cron-job.org
2. **Create job**:
   - URL: `https://your-app.onrender.com/health`
   - Schedule: Every 5 minutes
3. **Done**: Keeps service alive

### Option 3: GitHub Actions (Free)

Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Alive

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Health Endpoint
        run: curl https://your-app.onrender.com/health
```

**Note**: GitHub Actions may rate-limit frequent crons.

### Option 4: Self-Hosted Ping (Any Cron)

```bash
# Add to your crontab
*/5 * * * * curl https://your-app.onrender.com/health
```

---

## 🎯 Optimizations for Free Tier

### 1. Reduce Build Time

Your build is already optimized, but you can further reduce by:

```json
// package.json - already configured
{
  "scripts": {
    "build": "prisma generate && nest build"
  }
}
```

### 2. Minimize Dependencies

Only install production dependencies:
```bash
# Already configured in render-build.sh
pnpm install --frozen-lockfile
```

### 3. Use Redis Efficiently

With only 25 MB, be selective:

```typescript
// Cache only critical data
- User sessions: Yes
- Frequently accessed posts: Yes
- Large datasets: No
- User-generated content: No
```

### 4. Database Connection Pool

Reduce PostgreSQL connections (already configured):

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Free tier: Use minimal connections
  // connection_limit = 5
}
```

### 5. Optimize Cold Starts

Your app already implements:
- ✅ Cached NestJS app instance
- ✅ Lazy loading modules
- ✅ Optimized Prisma Client

---

## 📊 Performance Expectations

### Cold Start (After Sleep)
```
Initial request: 30-60 seconds
Subsequent requests: Normal speed
```

### Warm Performance
```
API response time: 100-500ms (normal endpoints)
Database queries: 50-200ms
File uploads: Depends on Cloudinary
```

### Memory Usage
```
Baseline (idle): ~150-200 MB
Active requests: ~250-350 MB
Peak usage: ~400-450 MB
Max available: 512 MB
```

**Tip**: Monitor memory in Dashboard → Metrics

---

## 💾 Backup Strategy (Critical for Free Tier!)

### Manual Backup

```bash
# Backup PostgreSQL
pg_dump $DATABASE_URL > backup.sql

# Or use Render Shell
# Dashboard → ding-postgres → Connect → Copy command
```

### Automated Backup (Recommended)

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Backup PostgreSQL
        run: |
          pg_dump ${{ secrets.DATABASE_URL }} > backup-$(date +%Y%m%d).sql
      
      - name: Upload to GitHub
        uses: actions/upload-artifact@v3
        with:
          name: db-backup
          path: backup-*.sql
          retention-days: 90
```

**Set secret**:
- Go to GitHub repo → Settings → Secrets
- Add `DATABASE_URL` from Render

---

## 🚨 When to Upgrade

### Signs You Need Starter Tier ($7/mo)

- ⚠️  Cold starts affecting user experience
- ⚠️  Need always-on service
- ⚠️  More than 750 hours/month usage
- ⚠️  Want to avoid sleep delays

### Signs You Need Standard Tier ($25/mo)

- ⚠️  Memory limits being hit (crashes)
- ⚠️  Slow response times under load
- ⚠️  Need high availability
- ⚠️  Production traffic

---

## ✅ Free Tier Deployment Checklist

Before deploying on free tier:

- [ ] Set up UptimeRobot or similar keep-alive service
- [ ] Configure frontend to handle cold starts (loading state)
- [ ] Set up weekly database backups
- [ ] Monitor memory usage after deployment
- [ ] Test cold start time (15 min inactivity)
- [ ] Document the 90-day PostgreSQL expiration
- [ ] Set calendar reminder for 80 days (backup before expiration)
- [ ] Inform users about potential delays after inactivity
- [ ] Use Cloudinary for ALL file uploads (no local storage)
- [ ] Keep Redis cache minimal (< 20 MB)

---

## 🎯 Best Use Cases for Free Tier

### ✅ Good For:
- Personal projects
- Portfolios
- Demos and prototypes
- Learning and development
- Low-traffic apps (<1000 requests/day)
- Side projects
- MVPs and testing

### ❌ Not Good For:
- Production applications
- Real-time features
- High-traffic apps
- Business-critical services
- Apps requiring <1s response times
- Services needing 24/7 uptime
- Memory-intensive applications

---

## 📈 Upgrade Path

```
Free Tier ($0/mo)
    ↓
    ↓ When cold starts affect UX
    ↓
Starter ($7/mo Web + $7/mo DB + $10/mo Redis = $24/mo)
    ↓
    ↓ When memory/CPU limits hit
    ↓
Standard ($25/mo Web + $20/mo DB + $20/mo Redis = $65/mo)
    ↓
    ↓ When scaling needed
    ↓
Pro/Enterprise (Custom pricing)
```

---

## 🔗 Free Tier Resources

- **Render Free Tier**: https://render.com/docs/free
- **UptimeRobot**: https://uptimerobot.com
- **Cron-job.org**: https://cron-job.org
- **Neo4j Aura Free**: https://neo4j.com/cloud/aura-free/

---

## 💡 Pro Tips

1. **Cold Start UX**: Show a friendly message
   ```
   "Waking up the server... This takes ~30 seconds on first visit."
   ```

2. **Monitor Costs**: Even on free tier
   - Watch for unexpected usage
   - Set up billing alerts

3. **Plan Ahead**: Free tier expires
   - PostgreSQL: 90 days inactivity
   - Regular backups essential

4. **Keep It Light**: 
   - Minimal dependencies
   - Efficient code
   - Small cache

5. **Test Thoroughly**:
   - Test cold start behavior
   - Monitor memory usage
   - Check after 15 min inactivity

---

**Remember**: Free tier is perfect for development, testing, and personal projects. For production apps with users, consider upgrading to Starter tier ($24/mo) for always-on service and better reliability! 🚀
