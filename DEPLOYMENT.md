# 🚀 BBD Complaint System - Deployment Guide

## Deployment Options

### Option 1: Docker Deployment (Recommended for Self-Hosting)

#### Prerequisites
- Docker & Docker Compose installed
- Domain name (optional, for HTTPS)
- At least 4GB RAM, 2 CPU cores

#### Steps

1. **Clone and Navigate**
```bash
git clone <your-repo-url>
cd bbd-complaint-system
```

2. **Create Production Environment File**
```bash
# Copy and edit the environment file
cp .env.example .env.production
```

Edit `.env.production` with production values:
```env
NODE_ENV=production
DATABASE_URL=postgresql://bbd_user:STRONG_PASSWORD@postgres:5432/bbd_complaints
POSTGRES_PASSWORD=STRONG_PASSWORD
JWT_ACCESS_SECRET=your-32-char-secret-key-here-1234
JWT_REFRESH_SECRET=your-32-char-refresh-key-here-5678
GEMINI_API_KEY=your-gemini-api-key
S3_SECRET_ACCESS_KEY=strong-minio-password
CORS_ORIGINS=https://your-domain.com
```

3. **Build and Start Services**
```bash
# Build all images
docker-compose -f docker-compose.yml build

# Start all services
docker-compose --env-file .env.production up -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed initial data (optional)
docker-compose exec backend npx prisma db seed
```

4. **Verify Deployment**
```bash
# Check all services are running
docker-compose ps

# Check logs
docker-compose logs -f
```

5. **Access the Application**
- Frontend: http://localhost (or your domain)
- Backend API: http://localhost/api/v1
- MinIO Console: http://localhost:9001

---

### Option 2: Cloud Deployment (Railway/Render)

#### Railway Deployment

1. **Create Railway Account**: https://railway.app

2. **Deploy Services**:
   - Create new project
   - Add PostgreSQL service
   - Add Redis service
   - Deploy Backend from GitHub
   - Deploy Frontend from GitHub
   - Deploy AI Service from GitHub

3. **Environment Variables** (set in Railway dashboard):
```
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>
JWT_ACCESS_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
GEMINI_API_KEY=<your-key>
NODE_ENV=production
```

#### Render Deployment

1. **Create Render Account**: https://render.com

2. **Create Services**:
   - **PostgreSQL**: Create new PostgreSQL database
   - **Redis**: Create new Redis instance
   - **Backend**: Create Web Service from repo (`apps/backend`)
   - **Frontend**: Create Static Site from repo (`apps/frontend`)
   - **AI Service**: Create Web Service from repo (`apps/ai-service`)

---

### Option 3: VPS Deployment (DigitalOcean/AWS EC2)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
```

#### 2. Clone & Configure
```bash
git clone <your-repo-url> /opt/bbd-complaint-system
cd /opt/bbd-complaint-system

# Create environment file
nano .env.production
# Add your production environment variables
```

#### 3. SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot -y

# Get SSL certificate
sudo certbot certonly --standalone -d complaints.bbdu.edu.in

# Copy certificates
sudo cp /etc/letsencrypt/live/complaints.bbdu.edu.in/fullchain.pem infra/nginx/ssl/
sudo cp /etc/letsencrypt/live/complaints.bbdu.edu.in/privkey.pem infra/nginx/ssl/
```

#### 4. Deploy
```bash
docker-compose --env-file .env.production up -d
```

---

### Option 4: Vercel + Supabase (Frontend + Database)

#### Frontend on Vercel
1. Push code to GitHub
2. Connect to Vercel: https://vercel.com
3. Import `apps/frontend` directory
4. Set environment variable:
   ```
   VITE_API_URL=https://your-backend-url/api/v1
   ```

#### Backend on Railway/Render
- Deploy backend separately with PostgreSQL

---

## Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set proper CORS origins
- [ ] Disable Swagger in production
- [ ] Set up firewall rules

### Performance
- [ ] Enable Redis caching
- [ ] Set up CDN for static assets
- [ ] Configure database connection pooling
- [ ] Enable gzip compression in Nginx

### Monitoring
- [ ] Set up health check endpoints
- [ ] Configure logging (Winston logs to file)
- [ ] Set up error tracking (Sentry)
- [ ] Monitor server resources

### Backup
- [ ] Set up daily PostgreSQL backups
- [ ] Configure S3/MinIO backup
- [ ] Test restore procedures

---

## Useful Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f ai-service

# Restart a service
docker-compose restart backend

# Update deployment
git pull
docker-compose build
docker-compose up -d

# Database backup
docker-compose exec postgres pg_dump -U bbd_user bbd_complaints > backup.sql

# Database restore
docker-compose exec -T postgres psql -U bbd_user bbd_complaints < backup.sql

# Enter container shell
docker-compose exec backend sh

# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy
```

---

## Nginx Configuration

The included `infra/nginx/nginx.conf` handles:
- Reverse proxy to backend/frontend
- SSL termination
- Gzip compression
- Static file caching

For custom domain, update the `server_name` directive.

---

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check PostgreSQL is running: `docker-compose ps`
   - Verify DATABASE_URL is correct

2. **AI features not working**
   - Check GEMINI_API_KEY is valid
   - Verify AI service is running: `docker-compose logs ai-service`

3. **CORS errors**
   - Update CORS_ORIGINS with your frontend domain

4. **SSL certificate issues**
   - Ensure certificates are in `infra/nginx/ssl/`
   - Check certificate permissions

---

## Support

For issues, contact: admin@bbdu.edu.in

