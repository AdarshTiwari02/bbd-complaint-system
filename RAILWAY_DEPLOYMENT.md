# 🚂 Railway Deployment Guide for BBD Complaint System

## Overview

This guide will help you deploy the BBD Complaint System on Railway with:
- ✅ PostgreSQL Database
- ✅ Redis Cache
- ✅ Backend API (NestJS)
- ✅ Frontend (React/Vite)
- ✅ AI Service (Node.js)

---

## Prerequisites

1. GitHub account with your code pushed
2. Railway account: https://railway.app (sign up with GitHub)
3. Gemini API Key: https://makersuite.google.com/app/apikey

---

## Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/bbd-complaint-system.git
git branch -M main
git push -u origin main
```

---

### Step 2: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `bbd-complaint-system` repository

---

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Wait for it to provision
4. Click on PostgreSQL → **"Variables"** tab
5. Copy the `DATABASE_URL` value (you'll need it later)

---

### Step 4: Add Redis

1. Click **"+ New"** → **"Database"** → **"Redis"**
2. Wait for it to provision
3. Copy the `REDIS_URL` from Variables tab

---

### Step 5: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repo
3. Click **"Configure"** and set:
   - **Root Directory**: `apps/backend`
   - **Watch Paths**: `/apps/backend/**`, `/prisma/**`

4. Go to **Variables** tab and add:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=<paste from PostgreSQL>
REDIS_URL=<paste from Redis>
JWT_ACCESS_SECRET=bbd-complaint-super-secret-access-key-2024-prod
JWT_REFRESH_SECRET=bbd-complaint-super-secret-refresh-key-2024-prod
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AI_SERVICE_URL=<will add after AI service deploy>
CORS_ORIGINS=<will add after frontend deploy>
SWAGGER_ENABLED=false
```

5. In **Settings** tab:
   - **Build Command**: `npm install && npx prisma generate --schema=../../prisma/schema.prisma && npm run build`
   - **Start Command**: `npx prisma migrate deploy --schema=../../prisma/schema.prisma && node dist/main.js`

6. Click **"Deploy"**

---

### Step 6: Deploy AI Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repo
3. Click **"Configure"**:
   - **Root Directory**: `apps/ai-service`
   - **Watch Paths**: `/apps/ai-service/**`

4. Add **Variables**:

```
NODE_ENV=production
PORT=3002
GEMINI_API_KEY=AIzaSyDzv8yBiBX7_kdzn9JulyyM0F4btgUGByQ
```

5. In **Settings**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`

6. Click **"Deploy"**
7. Copy the generated URL (e.g., `https://bbd-ai-service-xxx.railway.app`)
8. Go back to **Backend** service → **Variables** → Update `AI_SERVICE_URL` with this URL

---

### Step 7: Deploy Frontend

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repo
3. Click **"Configure"**:
   - **Root Directory**: `apps/frontend`
   - **Watch Paths**: `/apps/frontend/**`

4. Add **Variables**:

```
NODE_ENV=production
VITE_API_URL=https://<your-backend-url>/api/v1
```

5. In **Settings**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve dist -s -l 3000`

6. Click **"Deploy"**
7. Copy the frontend URL
8. Go back to **Backend** → **Variables** → Update `CORS_ORIGINS` with frontend URL

---

### Step 8: Run Database Seed (Optional)

1. Go to **Backend** service
2. Click **"..."** menu → **"Shell"**
3. Run:

```bash
npx prisma db seed --schema=../../prisma/schema.prisma
```

This creates the default admin user: `admin@bbdu.edu.in` / `Admin@123`

---

## Final Environment Variables Summary

### Backend Service
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:xxx@xxx.railway.internal:5432/railway
REDIS_URL=redis://default:xxx@xxx.railway.internal:6379
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AI_SERVICE_URL=https://bbd-ai-service-xxx.railway.app
CORS_ORIGINS=https://bbd-frontend-xxx.railway.app
SWAGGER_ENABLED=false
```

### AI Service
```
NODE_ENV=production
PORT=3002
GEMINI_API_KEY=AIzaSyDzv8yBiBX7_kdzn9JulyyM0F4btgUGByQ
```

### Frontend
```
NODE_ENV=production
VITE_API_URL=https://bbd-backend-xxx.railway.app/api/v1
```

---

## Custom Domain (Optional)

1. Go to your **Frontend** service
2. Click **Settings** → **Domains**
3. Add custom domain: `complaints.bbdu.edu.in`
4. Add these DNS records at your domain registrar:
   - **Type**: CNAME
   - **Name**: complaints
   - **Value**: `<railway-provided-value>`

---

## Monitoring & Logs

- **View Logs**: Click on any service → **Deployments** → Click deployment → View logs
- **Metrics**: Available in Railway dashboard
- **Alerts**: Set up in Settings → Notifications

---

## Estimated Costs

Railway Pricing (as of 2024):
- **Hobby Plan**: $5/month (includes $5 credit)
- **Pro Plan**: Pay as you go (~$10-20/month for this stack)

Free tier includes:
- 500 hours of compute
- Shared CPU & 512MB RAM
- Good for testing/demo

---

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` uses internal Railway URL
- Check PostgreSQL service is running

### AI Service Not Working
- Verify `GEMINI_API_KEY` is valid
- Check AI service logs for errors

### CORS Errors
- Update `CORS_ORIGINS` with exact frontend URL (including https://)
- Redeploy backend after changing

### Build Failures
- Check build logs in Railway
- Ensure all dependencies are in package.json

---

## Quick Commands

```bash
# View logs
railway logs

# Open shell
railway shell

# Run migrations
npx prisma migrate deploy --schema=../../prisma/schema.prisma

# Seed database
npx prisma db seed --schema=../../prisma/schema.prisma
```

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: Create on GitHub

