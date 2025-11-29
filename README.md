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
| **Student/Staff** | Submit tickets, track status, rate resolutions |
| **HOD** | Handle department tickets, escalate to Director |
| **Director** | Handle college tickets, reassign between HODs |
| **Transport Incharge** | Handle transport complaints |
| **Hostel Warden** | Handle hostel complaints |
| **Campus Admin** | Full access across all colleges |
| **Moderator** | Review flagged content, approve suggestions |
| **System Admin** | System configuration |

## 🔄 Routing Logic

```
Transport Complaint → Transport Incharge → Campus Admin
Hostel Complaint → Hostel Warden → Campus Admin
Academic Complaint → Department HOD → College Director → Campus Admin
Administrative → HOD/Admin → Campus Admin
```

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
git clone <repository-url>
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
# - GEMINI_API_KEY
# - S3 credentials
```

### 3. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Or Run Locally

```bash
# Start PostgreSQL and Redis (if not using Docker)
# ...

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start all services
pnpm dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs (Swagger)**: http://localhost:3001/api/docs
- **AI Service**: http://localhost:3002

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

### Docker Compose (Production)

```bash
# Build and start
docker-compose up -d --build

# Scale services
docker-compose up -d --scale backend=3
```

### Kubernetes

Helm charts and Kubernetes manifests available in `infra/k8s/` (to be added).

### CI/CD

GitHub Actions workflow automatically:
1. Runs lint and tests
2. Builds all services
3. Builds and pushes Docker images
4. Deploys to production (configurable)

## 📄 License

Proprietary - Babu Banarasi Das Educational Group

## 🤝 Contributing

Internal development team only.

---

Built with ❤️ for BBD Educational Group

