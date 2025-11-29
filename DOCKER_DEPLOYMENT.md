# 🐳 Docker Deployment Guide

Complete guide for deploying the BBD Complaint System using Docker and Docker Compose.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Building and Running](#building-and-running)
5. [Database Setup](#database-setup)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Docker** 20.10+ installed
- **Docker Compose** 2.0+ installed
- **Git** for cloning the repository
- **4GB+ RAM** available
- **10GB+ disk space**

### Verify Installation

```bash
docker --version
docker-compose --version
```

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/bbd-complaint-system.git
cd bbd-complaint-system
```

### 2. Create Environment File

```bash
cp env.example .env
```

### 3. Edit Environment Variables

Edit `.env` file with your configuration:

```env
# Database (used by docker-compose)
POSTGRES_PASSWORD=your-strong-password-here

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your-32-char-secret-key-here
JWT_REFRESH_SECRET=your-32-char-refresh-key-here

# Gemini API Key
GEMINI_API_KEY=your-gemini-api-key-here

# MinIO Credentials (change in production!)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Frontend URL
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

### 4. Build and Start Services

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 5. Initialize Database

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy --schema=../../prisma/schema.prisma

# Seed database (creates admin user: admin@bbdu.edu.in / Admin@123)
docker-compose exec backend npx prisma db seed --schema=../../prisma/schema.prisma
```

### 6. Create MinIO Bucket

If not using the setup script, create the storage bucket:

1. Go to http://localhost:9001
2. Login: `minioadmin` / `minioadmin`
3. Click **"Create Bucket"**
4. Name: `bbd-complaints`
5. Click **"Create Bucket"**

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **API Documentation**: http://localhost:3001/api/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

---

## Configuration

### Environment Variables

All environment variables are defined in `.env` file. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL database password | `bbd_password` |
| `JWT_ACCESS_SECRET` | JWT access token secret | Required |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Required |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `MINIO_ROOT_USER` | MinIO root username | `minioadmin` |
| `MINIO_ROOT_PASSWORD` | MinIO root password | `minioadmin` |

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Backend | 3001 | NestJS API |
| AI Service | 3002 | AI microservice |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/Queue |
| MinIO | 9000 | S3 API |
| MinIO Console | 9001 | Web UI |
| Nginx | 80/443 | Reverse proxy |

---

## Building and Running

### Build All Services

```bash
docker-compose build
```

### Build Specific Service

```bash
docker-compose build backend
docker-compose build frontend
docker-compose build ai-service
```

### Start Services

```bash
# Start in detached mode
docker-compose up -d

# Start with logs
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ai-service
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

---

## Database Setup

### Run Migrations

```bash
docker-compose exec backend npx prisma migrate deploy --schema=../../prisma/schema.prisma
```

### Seed Database

```bash
docker-compose exec backend npx prisma db seed --schema=../../prisma/schema.prisma
```

This creates:
- Default roles
- Sample campuses, colleges, departments
- Admin user: `admin@bbdu.edu.in` / `Admin@123`

### Access Database

```bash
# Using psql
docker-compose exec postgres psql -U bbd_user -d bbd_complaints

# Using Prisma Studio
docker-compose exec backend npx prisma studio --schema=../../prisma/schema.prisma
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U bbd_user bbd_complaints > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U bbd_user bbd_complaints < backup.sql
```

---

## Production Deployment

### 1. Update Environment Variables

Create `.env.production`:

```env
NODE_ENV=production
POSTGRES_PASSWORD=STRONG_PRODUCTION_PASSWORD
JWT_ACCESS_SECRET=STRONG_32_CHAR_SECRET
JWT_REFRESH_SECRET=STRONG_32_CHAR_SECRET
GEMINI_API_KEY=your-production-gemini-key
MINIO_ROOT_USER=production_user
MINIO_ROOT_PASSWORD=STRONG_MINIO_PASSWORD
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
```

### 2. Use Production Compose File

```bash
docker-compose -f docker-compose.yml --env-file .env.production up -d
```

### 3. Configure Nginx

Update `infra/nginx/nginx.conf` with your domain:

```nginx
server_name your-domain.com;
```

### 4. SSL/TLS Setup

1. Place SSL certificates in `infra/nginx/ssl/`:
   - `cert.pem` - Certificate
   - `key.pem` - Private key

2. Update nginx config to use SSL

### 5. Firewall Configuration

Open ports:
- `80` (HTTP)
- `443` (HTTPS)
- `22` (SSH, if needed)

### 6. Resource Limits

Update `docker-compose.yml` with resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check service status
docker-compose ps

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
docker-compose exec backend npx prisma db pull --schema=../../prisma/schema.prisma
```

### Build Failures

```bash
# Clean build
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache backend
```

### Port Conflicts

If ports are already in use:

1. Change ports in `docker-compose.yml`
2. Or stop conflicting services

### MinIO Bucket Not Created

```bash
# Access MinIO console
# http://localhost:9001
# Login: minioadmin/minioadmin
# Create bucket: bbd-complaints
```

### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
```

### Out of Memory

```bash
# Check Docker resources
docker stats

# Increase Docker memory limit in Docker Desktop settings
```

### Prisma Client Not Generated

```bash
docker-compose exec backend npx prisma generate --schema=../../prisma/schema.prisma
```

---

## Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run migrations if schema changed
docker-compose exec backend npx prisma migrate deploy --schema=../../prisma/schema.prisma
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything (⚠️ careful!)
docker system prune -a --volumes
```

### Monitoring

```bash
# View resource usage
docker stats

# View service health
docker-compose ps
```

---

## Security Best Practices

1. **Change Default Passwords**: Update all default credentials
2. **Use Strong Secrets**: Generate strong JWT secrets
3. **Enable SSL/TLS**: Use HTTPS in production
4. **Firewall Rules**: Restrict access to necessary ports
5. **Regular Updates**: Keep Docker images updated
6. **Backup Database**: Regular automated backups
7. **Environment Variables**: Never commit `.env` files
8. **Non-root User**: Services run as non-root users

---

## Support

For issues:
- Check logs: `docker-compose logs`
- Review this guide
- Check GitHub Issues
- Contact support

---

## Next Steps

- [ ] Set up SSL certificates
- [ ] Configure custom domain
- [ ] Set up automated backups
- [ ] Configure monitoring
- [ ] Set up CI/CD pipeline

