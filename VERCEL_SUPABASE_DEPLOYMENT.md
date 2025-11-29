# 🚀 Vercel + Supabase Deployment Guide

Complete guide for deploying the BBD Complaint System on Vercel (Frontend + Backend) and Supabase (Database + Storage).

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step 1: Supabase Setup](#step-1-supabase-setup)
4. [Step 2: Upstash Redis Setup](#step-2-upstash-redis-setup)
5. [Step 3: Deploy Frontend to Vercel](#step-3-deploy-frontend-to-vercel)
6. [Step 4: Deploy Backend to Vercel](#step-4-deploy-backend-to-vercel)
7. [Step 5: Deploy AI Service to Vercel](#step-5-deploy-ai-service-to-vercel)
8. [Step 6: Environment Variables](#step-6-environment-variables)
9. [Step 7: Database Setup](#step-7-database-setup)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- GitHub account with repository pushed
- Vercel account: https://vercel.com (sign up with GitHub)
- Supabase account: https://supabase.com (free tier available)
- Upstash account: https://upstash.com (free tier available)
- Google Gemini API key: https://makersuite.google.com/app/apikey

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Platform                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │  AI Service  │ │
│  │   (React)    │  │ (Serverless) │  │ (Serverless) │ │
│  │   Vercel     │  │   Vercel     │  │   Vercel     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          │ API Calls
                          │
        ┌─────────────────┴─────────────────┐
        │                                     │
┌───────▼────────┐                  ┌────────▼────────┐
│   Supabase     │                  │   Upstash       │
│                │                  │                 │
│ • PostgreSQL   │                  │ • Redis        │
│ • Storage      │                  │ • Queue        │
│ • Auth (opt)   │                  │                 │
└────────────────┘                  └─────────────────┘
```

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `bbd-complaint-system`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

4. Wait for project provisioning (~2 minutes)

### 1.2 Enable pgvector Extension

1. Go to **SQL Editor** in Supabase dashboard
2. Run this query:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 1.3 Get Database Connection String

1. Go to **Settings** → **Database**
2. Under **Connection string**, select **"URI"**
3. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual database password
5. Save this as `DATABASE_URL` (you'll need it later)

### 1.4 Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **"New bucket"**
3. Create bucket:
   - **Name**: `bbd-complaints`
   - **Public**: `false` (private bucket)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp,application/pdf,video/mp4,video/webm`

4. Go to **Storage** → **Policies**
5. Create policy for authenticated uploads (we'll configure this via API)

---

## Step 2: Upstash Redis Setup

### 2.1 Create Upstash Account

1. Go to https://upstash.com
2. Sign up with GitHub
3. Click **"Create Database"**

### 2.2 Create Redis Database

1. Fill in:
   - **Name**: `bbd-complaints-redis`
   - **Type**: `Regional` (choose closest region)
   - **Plan**: Free tier

2. Click **"Create"**

### 2.3 Get Redis Connection String

1. After creation, click on your database
2. Copy the **"REST URL"** (for REST API) or **"Redis URL"** (for direct connection)
3. Save this as `REDIS_URL` (you'll need it later)

Example format:
```
redis://default:[PASSWORD]@[ENDPOINT]:[PORT]
```

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Connect Repository

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository: `bbd-complaint-system`
4. Configure project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### 3.2 Environment Variables

Add these in Vercel project settings:

```
VITE_API_URL=https://your-backend-url.vercel.app/api/v1
NODE_ENV=production
```

**Note**: You'll update `VITE_API_URL` after deploying the backend.

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait for deployment (~2-3 minutes)
3. Copy the deployment URL (e.g., `https://bbd-complaints.vercel.app`)

---

## Step 4: Deploy Backend to Vercel

### 4.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 4.2 Create Vercel Serverless Function Structure

The backend needs to be adapted for Vercel serverless functions. We'll create an adapter.

### 4.3 Deploy Backend

1. In Vercel dashboard, create a new project:
   - **Root Directory**: `apps/backend`
   - **Framework Preset**: `Other`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Output Directory**: `dist`

2. Add environment variables (see Step 6)

3. Deploy

---

## Step 5: Deploy AI Service to Vercel

Similar to backend, deploy as serverless functions:

1. Create new Vercel project:
   - **Root Directory**: `apps/ai-service`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Output Directory**: `dist`

2. Add environment variables (see Step 6)

3. Deploy

---

## Step 6: Environment Variables

### Frontend (Vercel)

```
VITE_API_URL=https://your-backend.vercel.app/api/v1
NODE_ENV=production
```

### Backend (Vercel)

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
REDIS_URL=redis://default:[PASSWORD]@[ENDPOINT]:[PORT]
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AI_SERVICE_URL=https://your-ai-service.vercel.app
AI_SERVICE_API_KEY=your-ai-service-api-key-here
CORS_ORIGINS=https://your-frontend.vercel.app
SWAGGER_ENABLED=false
STORAGE_TYPE=supabase
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=bbd-complaints
```

### AI Service (Vercel)

```
NODE_ENV=production
PORT=3002
GEMINI_API_KEY=your-gemini-api-key-here
AI_SERVICE_API_KEY=your-ai-service-api-key-here
```

---

## Step 7: Database Setup

### 7.1 Run Migrations

1. Install Supabase CLI:

```bash
npm install -g supabase
```

2. Link to your project:

```bash
supabase link --project-ref [YOUR-PROJECT-REF]
```

3. Run migrations:

```bash
cd prisma
npx prisma migrate deploy
```

Or manually via Supabase SQL Editor:

1. Go to **SQL Editor** in Supabase
2. Copy contents of `prisma/migrations/[LATEST]/migration.sql`
3. Run the SQL

### 7.2 Seed Database

```bash
cd prisma
npx prisma db seed
```

Or via Supabase:

1. Go to **SQL Editor**
2. Run the seed script manually

### 7.3 Verify Setup

1. Go to **Table Editor** in Supabase
2. Verify tables are created:
   - `users`
   - `tickets`
   - `roles`
   - `campuses`
   - etc.

---

## Step 8: Update Storage Service for Supabase

The backend needs to use Supabase Storage instead of S3. Update the storage service configuration.

---

## Step 9: Configure CORS

Update backend CORS settings to allow your Vercel frontend domain.

---

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure pgvector extension is enabled

### Storage Upload Issues

- Verify Supabase Storage bucket exists
- Check storage policies are configured
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### Redis Connection Issues

- Verify `REDIS_URL` from Upstash
- Check Upstash database is active
- Test connection with Redis CLI

### Build Failures

- Check Node.js version (should be 20+)
- Verify pnpm is installed
- Check build logs in Vercel dashboard

---

## Next Steps

1. Set up custom domains (optional)
2. Configure email service (SendGrid)
3. Set up monitoring (Vercel Analytics)
4. Configure backups (Supabase)

---

## Support

For issues, check:
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Upstash Docs: https://docs.upstash.com

