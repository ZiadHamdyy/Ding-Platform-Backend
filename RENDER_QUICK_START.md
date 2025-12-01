# Render Deployment Quick Reference

## 🆓 FREE TIER DEPLOYMENT

> **Using Render Free Tier**: Service will **spin down after 15 minutes** of inactivity.  
> First request after sleep takes **30-60 seconds** (cold start).  
> See [RENDER_FREE_TIER.md](./RENDER_FREE_TIER.md) for optimizations and limitations.

---

## 🚀 Quick Deploy to Render (5 Minutes)

### Step 1: Setup Neo4j Aura (Required - 2 min)
1. Go to https://console.neo4j.io
2. Create a **free AuraDB** instance
3. Save the connection URI and password
   - URI format: `neo4j+s://xxxxx.databases.neo4j.io`
   - Auth format: `neo4j/yourpassword`

### Step 2: Deploy via Blueprint (2 min)
1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. **In Render Dashboard**:
   - Click "New +" → "Blueprint"
   - Connect GitHub repository
   - Select repo and branch
   - Render will detect `render.yaml`

3. **Set Required Environment Variables**:
   
   **Neo4j** (from Step 1):
   - `NEO4J_URI` - `neo4j+s://xxxxx.databases.neo4j.io`
   - `NEO4J_AUTH` - `neo4j/yourpassword`
   
   **Cloudinary** (get from https://cloudinary.com):
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   
   **SMTP** (e.g., Gmail):
   - `SMTP_HOST` - `smtp.gmail.com`
   - `SMTP_USER` - your email
   - `SMTP_PASS` - app password
   - `SMTP_FROM_EMAIL` - sender email
   
   **Google OAuth**:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL` - `https://your-app.onrender.com/api/v1/auth/google/callback`
   
   **Frontend**:
   - `FRONTEND_URL` - your frontend URL
   - `FRONTEND_URLS` - comma-separated allowed origins

4. **Click "Apply" to deploy**

### Step 3: Setup Keep-Alive (1 min - IMPORTANT for free tier!)

**Without this, your service will sleep after 15 minutes!**

1. **Go to UptimeRobot**: https://uptimerobot.com (free)
2. **Add New Monitor**:
   - Monitor Type: HTTP(s)
   - Friendly Name: Ding Backend
   - URL: `https://your-app.onrender.com/health`
   - Monitoring Interval: 5 minutes
3. **Save**: Service will stay awake!

> **Alternative**: See [RENDER_FREE_TIER.md](./RENDER_FREE_TIER.md) for other keep-alive options (Cron-job.org, GitHub Actions, etc.)

### Step 4: Verify Deployment
- **Health check**: `https://your-app.onrender.com/health`
- **API docs**: `https://your-app.onrender.com/api/docs`
- **Test cold start**: Wait 15 min, then make a request (expect 30-60s delay)

---

## 📋 What Was Created

### Services (All FREE Tier)
- ✅ **Web Service** - Node.js backend (512 MB RAM, 0.1 CPU)
- ✅ **PostgreSQL** - Primary database (1 GB, expires after 90 days inactivity)
- ✅ **Redis** - Caching layer (25 MB)
- ⚠️  **Neo4j** - External (Neo4j Aura Free)

### Files Created
- ✅ `render.yaml` - Infrastructure configuration (FREE tier)
- ✅ `src/health.controller.ts` - Health check endpoint
- ✅ `scripts/render-build.sh` - Build script
- ✅ `scripts/render-start.sh` - Start script with migrations
- ✅ `.nvmrc` - Node.js version specification
- ✅ `RENDER_DEPLOYMENT.md` - Comprehensive guide
- ✅ `RENDER_FREE_TIER.md` - Free tier optimizations

---

## ⚠️ FREE TIER WARNINGS

### 1. Service Sleeps After 15 Minutes
- **Impact**: First request takes 30-60 seconds
- **Solution**: Use UptimeRobot (see Step 3 above)
- **User Experience**: Show loading message: "Waking up server..."

### 2. PostgreSQL Expires After 90 Days
- **Impact**: Database deleted if no activity for 90 days
- **Solution**: Keep-alive service + weekly backups
- **Action**: Set calendar reminder for 80 days

### 3. Limited Resources
- **RAM**: 512 MB (may be tight during peak usage)
- **CPU**: 0.1 (slower processing)
- **Redis**: 25 MB (use sparingly for critical cache only)

### 4. No Persistent Disk
- **Impact**: Can't store files locally
- **Solution**: Already configured to use Cloudinary for all uploads

---

## 💰 Cost Breakdown (FREE)

```
Web Service (ding-backend):  $0/month ✅
PostgreSQL (ding-postgres):  $0/month ✅
Redis (ding-redis):          $0/month ✅
Neo4j Aura (free tier):      $0/month ✅
UptimeRobot (keep-alive):    $0/month ✅
────────────────────────────────────
TOTAL:                       $0/month 🎉
```

**Limitations**:
- 750 hours/month free tier
- Service sleeps after inactivity
- 1 GB PostgreSQL storage
- 25 MB Redis storage

**When to upgrade** ($24/month for Starter):
- Cold starts affecting users
- Need always-on service
- More than 750 hours/month

---

## 🆘 Troubleshooting

### Build Fails
**Check**:
- Render has pnpm support (auto-detected from package.json)
- All dependencies in package.json
- Build logs in Render dashboard

### Can't Connect to Neo4j
**Check**:
- `NEO4J_URI` format: `neo4j+s://xxxxx.databases.neo4j.io` (note the `+s` for SSL)
- `NEO4J_AUTH` format: `neo4j/password` (colon, not slash)
- Neo4j Aura instance is running

### Service Keeps Sleeping
**Solution**:
- Set up UptimeRobot or similar (Step 3 above)
- Verify monitor is active and pinging every 5 minutes

### Migration Errors
**Run manually**:
```bash
# In Render Shell (Dashboard → Service → Shell)
pnpm prisma migrate deploy
```

### Memory Errors (Out of Memory)
**Solutions**:
- Reduce connection pool size
- Clear unnecessary cache
- **Upgrade to Starter tier** ($7/month)

---

## 📚 Full Documentation

| File | Purpose |
|------|---------|
| **[README.md](./README.md)** | Main overview & quick start |
| **[RENDER_FREE_TIER.md](./RENDER_FREE_TIER.md)** | **FREE TIER optimizations** ⭐ |
| **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** | Complete deployment guide |
| **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** | Docker alternative |

---

## ✅ Deployment Checklist

Before going live:

- [ ] Neo4j Aura instance created
- [ ] All environment variables set in Render
- [ ] UptimeRobot monitor configured (keep-alive)
- [ ] Health endpoint tested
- [ ] API documentation accessible
- [ ] Cold start time tested (wait 15 min)
- [ ] Frontend configured with loading state
- [ ] Weekly backup scheduled
- [ ] 90-day calendar reminder set
- [ ] Team informed about cold starts
- [ ] Cloudinary configured for uploads

---

## 🎯 Next Steps

1. **Test your deployment**:
   ```bash
   curl https://your-app.onrender.com/health
   ```

2. **Configure frontend** to handle cold starts:
   ```javascript
   // Show loading state for first request
   const timeout = setTimeout(() => {
     showMessage("Waking up server... ~30 seconds");
   }, 1000);
   ```

3. **Set up backups** (see [RENDER_FREE_TIER.md](./RENDER_FREE_TIER.md))

4. **Monitor usage** (Dashboard → Metrics)

5. **Plan for upgrade** when needed

---

## 🚀 You're Live!

Your backend is now deployed on Render's **free tier**!

- **Cost**: $0/month 🎉
- **Limitations**: Service sleeps, limited resources
- **Best for**: Personal projects, demos, portfolios

**Upgrade when ready**: See cost comparison in [RENDER_FREE_TIER.md](./RENDER_FREE_TIER.md)

---

**Questions?** Check [RENDER_FREE_TIER.md](./RENDER_FREE_TIER.md) for detailed free tier guide!

