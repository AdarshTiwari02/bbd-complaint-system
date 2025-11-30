# 🚀 Quick Localhost Deployment Guide

## Current Status

✅ **Infrastructure services are running:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `localhost:9000` (Console: `localhost:9001`)

## Option 1: Hybrid Deployment (Recommended for Development)

Run infrastructure in Docker, apps locally:

### 1. Start Infrastructure
```bash
docker-compose up -d postgres redis minio
```

### 2. Setup Database
```bash
# From project root
npx prisma migrate deploy
npx prisma db seed
```

### 3. Start Applications Locally

**Terminal 1 - Backend:**
```bash
cd apps/backend
pnpm run dev
```

**Terminal 2 - AI Service:**
```bash
cd apps/ai-service
pnpm run dev
```

**Terminal 3 - Frontend:**
```bash
cd apps/frontend
pnpm run dev
```

### 4. Access
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- AI Service: http://localhost:3002
- API Docs: http://localhost:3001/api/docs

---

## Option 2: Full Docker Deployment

### Fix TypeScript Build Issues

The current Docker build has TypeScript module resolution issues with pnpm workspaces. To fix:

1. **Update tsconfig.json files** to properly extend base config
2. **Use `skipLibCheck: true`** in build
3. **Ensure all dependencies are installed correctly**

### Quick Fix Commands

```bash
# Build with skipLibCheck
docker-compose build --no-cache

# Or build services individually
docker-compose build backend
docker-compose build frontend  
docker-compose build ai-service
```

### Start All Services

```bash
docker-compose up -d
```

### Initialize Database

```bash
docker-compose exec backend npx prisma migrate deploy --schema=../../prisma/schema.prisma
docker-compose exec backend npx prisma db seed --schema=../../prisma/schema.prisma
```

---

## Option 3: Development with Docker Compose Override

Create `docker-compose.override.yml`:

```yaml
version: '3.8'
services:
  backend:
    volumes:
      - ./apps/backend:/app/apps/backend
      - ./shared:/app/shared
    command: pnpm --filter @bbd/backend run dev
  
  frontend:
    volumes:
      - ./apps/frontend:/app/apps/frontend
    command: pnpm --filter @bbd/frontend run dev
  
  ai-service:
    volumes:
      - ./apps/ai-service:/app/apps/ai-service
    command: pnpm --filter @bbd/ai-service run dev
```

Then:
```bash
docker-compose up
```

---

## Environment Variables

Make sure your `.env` file has:

```env
DATABASE_URL=postgresql://bbd_user:bbd_password@localhost:5432/bbd_complaints?schema=public
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
GEMINI_API_KEY=your-gemini-key-here
AI_SERVICE_URL=http://localhost:3002
REDIS_URL=redis://localhost:6379
```

---

## Troubleshooting

### Port Already in Use
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue).OwningProcess | Stop-Process -Force
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d postgres redis minio
npx prisma migrate deploy
npx prisma db seed
```

---

## Next Steps

1. **For Development**: Use Option 1 (Hybrid)
2. **For Production**: Fix Docker build issues first, then use Option 2
3. **For Quick Testing**: Use Option 3 with volume mounts

---

## Default Admin Credentials

- Email: `admin@bbdu.edu.in`
- Password: `Admin@123`



