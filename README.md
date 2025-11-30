# BBD Complaint & Suggestion Management System

A production-ready complaint and suggestion management system for **Babu Banarasi Das Educational Group** (BBD University, BBD NITM, BBD NIIT, BBD Dental College).

## 🏗 Architecture

This is a **monorepo** containing:

```
bbd-complaint-system/
├── apps/
│   ├── backend/          # NestJS API (Node.js + TypeScript + Prisma)
│   ├── frontend/         # React Web App (Vite + TypeScript + Tailwind)
│   └── ai-service/       # AI Microservice (Gemini API)
├── infra/                # Infrastructure configs
│   └── nginx/            # Nginx reverse proxy
├── prisma/               # Database schema
├── shared/               # Shared types and utilities
├── .github/              # CI/CD workflows
└── docker-compose.yml    # Container orchestration
```

## 🚀 Features

### Core Features
- **Multi-college Support**: BBD University, BBD NITM, BBD NIIT, BBD Dental
- **Smart Ticket Routing**: Auto-routes to HOD, Director, Transport Incharge, Hostel Warden, or Campus Admin
- **Anonymous Submissions**: Identity hidden from handlers but stored for abuse prevention
- **SLA Management**: Priority-based SLAs with auto-escalation
- **Rating System**: 1-5 star ratings with feedback

### AI-Powered Features (Gemini API)
- **Auto-Categorization**: Classify tickets by category with confidence scores
- **Priority Prediction**: Suggest priority based on content analysis
- **Toxicity Detection**: Flag abusive/spam content
- **Smart Reply Drafts**: Generate empathetic responses for handlers
- **Ticket Summarization**: TL;DR for long conversations
- **Duplicate Detection**: Find similar existing tickets
- **Trend Analysis**: Identify recurring issues
- **OCR**: Extract text from uploaded images/PDFs
- **Chatbot Intake**: Conversational ticket submission
- **AI Admin Assistant**: Chatbot for admins to get solution suggestions
- **Text Enhancement**: Improve language quality of complaints/suggestions and replies

### Security
- **JWT Auth**: Access + Refresh tokens
- **MFA**: Optional TOTP-based 2FA for admins
- **RBAC**: Role-based permissions
- **Rate Limiting**: Per-IP and per-user limits
- **File Validation**: Type and size restrictions
- **GDPR**: Data export and account deletion

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Student** | Submit tickets, track status, rate resolutions |
| **Staff/Faculty** | Submit tickets, handle assigned tickets (if authorized) |
| **Class Coordinator** | Verify students, handle class-level tickets |
| **HOD** | Handle department tickets, verify staff/faculty, escalate to Director |
| **Proctor** | Handle disciplinary tickets, verified by Director/Dean |
| **Director** | Handle college tickets, verify HODs/Proctors, create roles |
| **Dean** | Handle college-level tickets, verify HODs/Proctors, create roles |
| **Transport Incharge** | Handle transport complaints directly |
| **Hostel Warden** | Handle hostel complaints directly |
| **Director Finance** | Handle finance-related tickets |
| **Campus Admin** | Full access across all colleges |
| **Moderator** | Review flagged content, approve suggestions |
| **System Admin** | System configuration, verify superior authorities, create roles |

## 🔄 Routing Logic

### Direct Routing (Bypasses HODs)
- **Transport Complaints** → Transport Incharge → Campus Admin
- **Hostel Complaints** → Hostel Warden → Campus Admin
- **Campus-Level Complaints** → System Admin

### Hierarchical Routing
- **Academic/Department Complaints** → Department HOD → College Director/Dean → Campus Admin
- **Administrative** → HOD/Admin → Campus Admin

### User Verification Flow
- **Directors, Deans, Hostel Incharge, Transport Incharge, Director Finance** → Verified by System Admin
- **HODs, Proctors** → Verified by Director/Dean of their college
- **Staff, Faculty, Class Coordinators** → Verified by their respective HOD
- **Students** → Verified by their Class Coordinator

## 🛠 Tech Stack

- **Backend**: Node.js, TypeScript, NestJS, Prisma, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand
- **AI Service**: Node.js, TypeScript, Google Gemini API
- **Queue**: BullMQ + Redis
- **Storage**: S3-compatible (MinIO/AWS S3)
- **Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Containers**: Docker, Docker Compose

## 📦 Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/bbd-complaint-system.git
cd bbd-complaint-system
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your values:
# - DATABASE_URL
# - JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
# - GEMINI_API_KEY (required for AI features)
# - AI_SERVICE_API_KEY (for AI service authentication)
# - S3 credentials (or use Supabase storage)
```

### 3. Hybrid Development (Recommended)

Run infrastructure in Docker, apps locally for faster development:

```bash
# Start infrastructure (PostgreSQL, Redis, MinIO)
docker-compose up -d postgres redis minio

# Setup database
pnpm db:migrate:prod
pnpm db:seed

# Start all applications
pnpm run dev
```

**Access:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/v1
- **API Docs**: http://localhost:3001/api/docs
- **AI Service**: http://localhost:3002

**Default Admin:**
- Email: `admin@bbdu.edu.in`
- Password: `Admin@123`

### 4. Full Docker Deployment

```bash
# Build and start all services
docker-compose build
docker-compose up -d

# Initialize database
docker-compose exec backend npx prisma migrate deploy --schema=../../prisma/schema.prisma
docker-compose exec backend npx prisma db seed --schema=../../prisma/schema.prisma
```

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed instructions.

### 5. Other Deployment Options

- **Vercel + Supabase**: See [VERCEL_SUPABASE_DEPLOYMENT.md](./VERCEL_SUPABASE_DEPLOYMENT.md)
- **Railway**: See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Local Development**: See [START_DEV.md](./START_DEV.md)

## 📚 API Documentation

Swagger documentation available at `/api/docs` when running the backend.

### Key Endpoints

```
# Auth
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

# Tickets
POST /api/v1/tickets
GET  /api/v1/tickets
GET  /api/v1/tickets/:id
PUT  /api/v1/tickets/:id
POST /api/v1/tickets/:id/messages
POST /api/v1/tickets/:id/escalate
POST /api/v1/tickets/:id/rate
GET  /api/v1/tickets/:id/timeline
GET  /api/v1/tickets/track/:ticketNumber (public)

# Organization
GET /api/v1/organization/campuses
GET /api/v1/organization/colleges
GET /api/v1/organization/departments

# Analytics
GET /api/v1/analytics/overview
GET /api/v1/analytics/by-college
GET /api/v1/analytics/sla
GET /api/v1/analytics/satisfaction
GET /api/v1/analytics/heatmap
GET /api/v1/analytics/ai-insights

# AI
POST /api/v1/ai/classify
POST /api/v1/ai/priority
POST /api/v1/ai/chatbot
```

## 🗄 Database Schema

### Core Entities

- **User**: Students, staff, and admins
- **Role**: STUDENT, STAFF, HOD, DIRECTOR, etc.
- **Campus**: BBD Educational Group campuses
- **College**: BBDU, BBD NITM, BBD NIIT, BBD Dental
- **Department**: CSE, IT, ECE, Mechanical, etc.
- **Ticket**: Complaints and suggestions
- **TicketMessage**: Conversation thread
- **Attachment**: File uploads
- **Escalation**: Routing history
- **AiPrediction**: AI analysis results
- **Suggestion**: Public suggestion board
- **AuditLog**: Action tracking

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_ACCESS_SECRET` | Access token secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `GEMINI_API_KEY` | Google Gemini API key | Required for AI |
| `S3_ENDPOINT` | S3/MinIO endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY_ID` | S3 access key | Required |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | Required |
| `S3_BUCKET_NAME` | S3 bucket name | `bbd-complaints` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `AI_SERVICE_URL` | AI microservice URL | `http://localhost:3002` |

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Run e2e tests
pnpm test:e2e
```

## 📊 Monitoring

- **Logs**: Winston (console + file rotation)
- **Health Checks**: `/health` endpoints on all services
- **Metrics**: Ready for Prometheus integration

## 🚢 Deployment

### Deployment Guides

- **[Docker Deployment](./DOCKER_DEPLOYMENT.md)**: Complete Docker setup guide
- **[Docker Localhost](./DOCKER_LOCALHOST.md)**: Quick localhost deployment options
- **[Vercel + Supabase](./VERCEL_SUPABASE_DEPLOYMENT.md)**: Serverless deployment guide
- **[Railway Deployment](./RAILWAY_DEPLOYMENT.md)**: Railway platform deployment
- **[Start Development](./START_DEV.md)**: Development environment setup

### Quick Deployment Options

**Docker Compose (Production)**
```bash
docker-compose build
docker-compose up -d
```

**Vercel + Supabase (Serverless)**
- Frontend: Vercel
- Backend/AI: Vercel Serverless Functions
- Database/Storage: Supabase

**Railway**
- One-click deployment for all services
- Automatic PostgreSQL and Redis provisioning

### CI/CD

GitHub Actions workflow automatically:
1. Runs lint and tests
2. Builds all services
3. Builds and pushes Docker images
4. Deploys to production (configurable)

## 📚 Additional Documentation

- **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)**: Complete Docker deployment guide
- **[DOCKER_LOCALHOST.md](./DOCKER_LOCALHOST.md)**: Localhost deployment options
- **[VERCEL_SUPABASE_DEPLOYMENT.md](./VERCEL_SUPABASE_DEPLOYMENT.md)**: Vercel + Supabase setup
- **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)**: Railway deployment guide
- **[START_DEV.md](./START_DEV.md)**: Development environment quick start

## 🆕 Recent Features

- ✅ **Hierarchical User Verification**: Multi-level verification system
- ✅ **Role Management**: System Admin, Directors, and Deans can create new roles
- ✅ **Direct Complaint Routing**: Transport/Hostel/Campus complaints bypass HODs
- ✅ **AI Admin Assistant**: Chatbot for admins to get solution suggestions
- ✅ **Text Enhancement**: AI-powered language improvement for complaints and replies
- ✅ **Supabase Storage Support**: Alternative to S3 for file storage

## 📄 License

Proprietary - Babu Banarasi Das Educational Group

## 🤝 Contributing

Internal development team only.

---

Built with ❤️ for BBD Educational Group

