# Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NGINX REVERSE PROXY                            │
│                           (SSL, Load Balancing, Rate Limiting)              │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                    │                    │
                    ▼                    ▼                    ▼
         ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
         │     FRONTEND     │  │     BACKEND      │  │   AI SERVICE     │
         │   (React + Vite) │  │    (NestJS)      │  │   (Express)      │
         │   Port: 3000     │  │   Port: 3001     │  │   Port: 3002     │
         └──────────────────┘  └──────────────────┘  └──────────────────┘
                                       │                      │
                    ┌──────────────────┴──────────────────────┤
                    │                                         │
                    ▼                                         ▼
         ┌──────────────────┐                      ┌──────────────────┐
         │   PostgreSQL     │                      │   Google Gemini  │
         │   (Database)     │                      │   (AI API)       │
         └──────────────────┘                      └──────────────────┘
                    │
         ┌──────────┴──────────┬──────────────────┐
         │                     │                  │
         ▼                     ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│      Redis       │  │      MinIO       │  │     BullMQ       │
│     (Cache)      │  │    (S3 Storage)  │  │     (Queues)     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Data Flow

### Ticket Creation Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │───▶│Frontend │───▶│ Backend │───▶│AI Queue │───▶│AI Worker│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                                   │                              │
                                   │         ┌────────────────────┘
                                   ▼         ▼
                              ┌─────────────────┐
                              │   PostgreSQL    │
                              │  (Store Ticket  │
                              │  + AI Results)  │
                              └─────────────────┘
```

### Escalation Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  STUDENT │         │    HOD   │         │ DIRECTOR │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │  Submit Ticket     │                    │
     ├───────────────────▶│                    │
     │                    │                    │
     │                    │  Escalate          │
     │                    ├───────────────────▶│
     │                    │                    │
     │                    │                    │  Escalate
     │                    │                    ├───────────────▶┌─────────────┐
     │                    │                    │                │CAMPUS ADMIN │
     │                    │                    │                └─────────────┘
```

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     CAMPUS      │────▶│     COLLEGE     │────▶│   DEPARTMENT    │
│                 │     │                 │     │                 │
│ id              │     │ id              │     │ id              │
│ name            │     │ name            │     │ name            │
│ code            │     │ campusId        │     │ collegeId       │
│                 │     │ directorId      │     │ hodUserId       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                       │
                               ▼                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │      USER       │◀────│     TICKET      │
                        │                 │     │                 │
                        │ id              │     │ id              │
                        │ email           │     │ ticketNumber    │
                        │ firstName       │     │ title           │
                        │ lastName        │     │ description     │
                        │ collegeId       │     │ category        │
                        │ departmentId    │     │ status          │
                        │ roles[]         │     │ priority        │
                        └─────────────────┘     │ createdByUserId │
                               │               │ assignedToUserId│
                               │               │ currentLevel    │
                               ▼               └─────────────────┘
                        ┌─────────────────┐            │
                        │      ROLE       │            │
                        │                 │            ▼
                        │ id              │     ┌─────────────────┐
                        │ name            │     │ TICKET_MESSAGE  │
                        │ permissions[]   │     │                 │
                        └─────────────────┘     │ id              │
                                                │ ticketId        │
                                                │ message         │
                                                │ senderUserId    │
                                                └─────────────────┘
```

## Module Structure (Backend)

```
apps/backend/src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
├── common/
│   ├── filters/               # Exception filters
│   ├── interceptors/          # Request/response interceptors
│   └── logger/                # Winston logger
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts      # Database service
├── redis/
│   └── redis.module.ts        # Cache configuration
├── queue/
│   ├── queue.module.ts        # BullMQ setup
│   └── processors/            # Job processors
│       ├── ocr.processor.ts
│       ├── ai.processor.ts
│       └── notification.processor.ts
└── modules/
    ├── auth/                  # Authentication & authorization
    │   ├── auth.module.ts
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   ├── mfa.service.ts
    │   ├── dto/
    │   ├── guards/
    │   ├── strategies/
    │   └── decorators/
    ├── users/                 # User management
    ├── roles/                 # Role management
    ├── organization/          # Campus, College, Department
    ├── tickets/               # Core ticket handling
    │   ├── tickets.module.ts
    │   ├── tickets.service.ts
    │   ├── tickets.controller.ts
    │   ├── ticket-routing.service.ts  # Smart routing logic
    │   └── dto/
    ├── files/                 # S3 file uploads
    ├── suggestions/           # Public suggestion board
    ├── analytics/             # Reports and metrics
    ├── moderation/            # Content moderation
    ├── ai/                    # AI service integration
    └── audit/                 # Audit logging
```

## AI Service Endpoints

```
POST /ai/classify-ticket      # Categorize ticket
POST /ai/predict-priority     # Suggest priority
POST /ai/moderate             # Check for toxicity
POST /ai/generate-reply       # Draft response
POST /ai/summarize-ticket     # Create summary
POST /ai/embeddings           # Generate vectors
POST /ai/similar-tickets      # Find duplicates
POST /ai/ocr                  # Extract text from images
POST /ai/trends               # Analyze patterns
POST /ai/chatbot-intake       # Conversational intake
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX (TLS, Rate Limiting)               │
├─────────────────────────────────────────────────────────────────┤
│                        Helmet (Security Headers)                │
├─────────────────────────────────────────────────────────────────┤
│                        JWT Authentication                       │
├─────────────────────────────────────────────────────────────────┤
│                        RBAC Guards                              │
├─────────────────────────────────────────────────────────────────┤
│                        Input Validation (class-validator)       │
├─────────────────────────────────────────────────────────────────┤
│                        XSS Sanitization                         │
├─────────────────────────────────────────────────────────────────┤
│                        Audit Logging                            │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                            │
│                    (AWS ALB / Nginx / Traefik)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Backend     │   │   Backend     │   │   Backend     │
│   Instance 1  │   │   Instance 2  │   │   Instance 3  │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   PostgreSQL  │   │     Redis     │   │     MinIO     │
│   (Primary)   │   │   (Cluster)   │   │   (Cluster)   │
└───────────────┘   └───────────────┘   └───────────────┘
        │
        ▼
┌───────────────┐
│   PostgreSQL  │
│   (Replica)   │
└───────────────┘
```

