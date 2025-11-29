# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- PostgreSQL 16+ with pgvector extension
- Redis 7+
- S3-compatible storage (MinIO/AWS S3)
- Domain with SSL certificate
- Google Gemini API key

## Quick Start (Docker Compose)

### 1. Clone Repository

```bash
git clone <repository-url>
cd bbd-complaint-system
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with production values:

```env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/bbd_complaints

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-256-bit-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# S3 Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=bbd-complaints
S3_REGION=ap-south-1

# Redis
REDIS_URL=redis://redis:6379

# Frontend
VITE_API_URL=https://api.bbd-complaints.edu.in
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec backend pnpm db:migrate

# Seed initial data
docker-compose exec backend pnpm db:seed
```

### 5. Access Application

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

---

## Production Deployment

### Infrastructure Recommendations

```
┌─────────────────────────────────────────────────────────────────┐
│                     AWS / Azure / GCP                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐                                              │
│  │   CloudFront  │  (CDN for frontend assets)                   │
│  └───────┬───────┘                                              │
│          │                                                       │
│  ┌───────▼───────┐                                              │
│  │      ALB      │  (Application Load Balancer)                 │
│  └───────┬───────┘                                              │
│          │                                                       │
│  ┌───────┴───────────────────────────────────────┐              │
│  │                                                │              │
│  ▼                                                ▼              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │  Backend   │  │  Backend   │  │  Backend   │  (ECS/EKS)      │
│  │  Task 1    │  │  Task 2    │  │  Task 3    │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │   RDS      │  │ ElastiCache│  │     S3     │                 │
│  │ PostgreSQL │  │   Redis    │  │  (Files)   │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### AWS ECS Deployment

1. **Create ECR Repositories**

```bash
aws ecr create-repository --repository-name bbd/backend
aws ecr create-repository --repository-name bbd/frontend
aws ecr create-repository --repository-name bbd/ai-service
```

2. **Build and Push Images**

```bash
# Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.ap-south-1.amazonaws.com

# Build and push
docker build -t bbd/backend ./apps/backend
docker tag bbd/backend:latest 123456789.dkr.ecr.ap-south-1.amazonaws.com/bbd/backend:latest
docker push 123456789.dkr.ecr.ap-south-1.amazonaws.com/bbd/backend:latest
```

3. **Create ECS Task Definition**

```json
{
  "family": "bbd-backend",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789.dkr.ecr.ap-south-1.amazonaws.com/bbd/backend:latest",
      "memory": 1024,
      "cpu": 512,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "JWT_ACCESS_SECRET", "valueFrom": "arn:aws:secretsmanager:..." }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bbd-backend",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Database Setup (RDS)

1. **Create RDS PostgreSQL Instance**

```bash
aws rds create-db-instance \
  --db-instance-identifier bbd-complaints-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16 \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --multi-az \
  --backup-retention-period 7
```

2. **Enable pgvector Extension**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

3. **Run Migrations**

```bash
DATABASE_URL=postgresql://... pnpm db:migrate:deploy
```

### Redis Setup (ElastiCache)

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id bbd-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### SSL/TLS Configuration

1. **Request ACM Certificate**

```bash
aws acm request-certificate \
  --domain-name complaints.bbdu.edu.in \
  --validation-method DNS
```

2. **Configure ALB with HTTPS**

```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

## Monitoring & Logging

### CloudWatch Logs

Configure log groups for each service:

```bash
aws logs create-log-group --log-group-name /ecs/bbd-backend
aws logs create-log-group --log-group-name /ecs/bbd-ai-service
```

### CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name bbd-backend-cpu-high \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:...

# Error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name bbd-backend-errors \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:...
```

### Health Checks

All services expose health endpoints:

- Backend: `GET /health`
- AI Service: `GET /health`
- Frontend: Static file availability

---

## Backup Strategy

### Database Backups

1. **Automated RDS Snapshots** (daily, 7-day retention)
2. **Point-in-Time Recovery** enabled
3. **Cross-region replication** for DR

### File Storage Backups

1. **S3 Versioning** enabled
2. **Lifecycle policies** for archival
3. **Cross-region replication**

### Restore Procedure

```bash
# Restore from RDS snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier bbd-complaints-restored \
  --db-snapshot-identifier rds:bbd-complaints-db-2024-01-15-00-00

# Point-in-time recovery
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier bbd-complaints-db \
  --target-db-instance-identifier bbd-complaints-pitr \
  --restore-time 2024-01-15T10:30:00Z
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale ECS service
aws ecs update-service \
  --cluster bbd-cluster \
  --service bbd-backend \
  --desired-count 5

# Auto-scaling policy
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/bbd-cluster/bbd-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

### Database Scaling

- **Read Replicas** for read-heavy workloads
- **Connection pooling** with PgBouncer
- **Vertical scaling** for increased load

---

## Security Checklist

- [ ] SSL/TLS enabled (HTTPS only)
- [ ] WAF rules configured
- [ ] Security groups locked down
- [ ] Secrets in AWS Secrets Manager
- [ ] IAM roles with least privilege
- [ ] VPC with private subnets
- [ ] Database not publicly accessible
- [ ] Encryption at rest enabled
- [ ] Regular security patches
- [ ] Penetration testing completed

