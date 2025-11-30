# 🐳 Quick Docker Deployment Guide

## Quick Start

1. **Clone and navigate:**
   ```bash
   git clone <your-repo-url>
   cd bbd-complaint-system
   ```

2. **Create environment file:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Build and start:**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Initialize database:**
   ```bash
   docker-compose exec backend npx prisma migrate deploy --schema=../../prisma/schema.prisma
   docker-compose exec backend npx prisma db seed --schema=../../prisma/schema.prisma
   ```

5. **Access:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001/api/v1
   - API Docs: http://localhost:3001/api/docs
   - MinIO: http://localhost:9001

## Default Admin
- Email: `admin@bbdu.edu.in`
- Password: `Admin@123`

## Full Documentation
See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for complete guide.



