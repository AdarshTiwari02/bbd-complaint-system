# Database Schema Documentation

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                 │
│                    BBD Complaint & Suggestion System                        │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   Campus    │
                                    ├─────────────┤
                                    │ id (PK)     │
                                    │ name        │
                                    │ code        │◄──────────────────┐
                                    │ city        │                   │
                                    │ state       │                   │
                                    │ address     │                   │
                                    │ phone       │                   │
                                    │ email       │                   │
                                    └──────┬──────┘                   │
                                           │ 1:N                      │
                                           ▼                          │
┌─────────────┐                    ┌─────────────┐                    │
│    Role     │                    │   College   │                    │
├─────────────┤                    ├─────────────┤                    │
│ id (PK)     │                    │ id (PK)     │                    │
│ name (enum) │                    │ name        │                    │
│ displayName │                    │ code        │◄─────────┐        │
│ description │                    │ campusId(FK)│──────────┼────────┘
│ permissions │                    │ directorId  │          │
│ isSystem    │                    └──────┬──────┘          │
└──────┬──────┘                           │ 1:N             │
       │                                  ▼                 │
       │ N:M                      ┌─────────────┐           │
       │                          │ Department  │           │
       │                          ├─────────────┤           │
       ▼                          │ id (PK)     │           │
┌─────────────┐                   │ name        │           │
│  UserRole   │                   │ code        │◄──────────┤
├─────────────┤                   │ collegeId(FK)│──────────┘
│ id (PK)     │                   │ hodUserId   │
│ userId (FK) │───────────────────│             │
│ roleId (FK) │───────────────────└──────┬──────┘
│ assignedAt  │                          │
│ assignedBy  │                          │
└─────────────┘                          │
       ▲                                 │
       │                                 │
       │ N:M                             │
       │                                 ▼
┌──────┴──────┐                  ┌─────────────┐
│    User     │                  │   Ticket    │
├─────────────┤                  ├─────────────┤
│ id (PK)     │◄─────────────────│ id (PK)     │
│ email       │                  │ ticketNumber│
│ passwordHash│                  │ title       │
│ firstName   │                  │ description │
│ lastName    │                  │ type        │
│ phone       │                  │ category    │
│ avatar      │                  │ priority    │
│ studentId   │                  │ status      │
│ employeeId  │                  │ currentLevel│
│ status      │                  │ isAnonymous │
│ emailVerify │    Creates       │ slaDueAt    │
│ mfaSecret   │◄─────────────────│ resolvedAt  │
│ campusId(FK)│                  │ closedAt    │
│ collegeId   │    Assigned To   │ rating      │
│ departmentId│◄─────────────────│ feedback    │
│ refreshToken│                  │ createdBy   │
│ resetToken  │                  │ assignedTo  │
│ lastLoginAt │                  │ collegeId   │
│ createdAt   │                  │ departmentId│
│ updatedAt   │                  │ campusId    │
└─────────────┘                  └──────┬──────┘
       │                                │
       │                    ┌───────────┼───────────┬───────────┐
       │                    │           │           │           │
       │                    ▼           ▼           ▼           ▼
       │           ┌────────────┐┌────────────┐┌──────────┐┌──────────┐
       │           │TicketMsg   ││ Attachment ││ AiPredict││Escalation│
       │           ├────────────┤├────────────┤├──────────┤├──────────┤
       │           │ id (PK)    ││ id (PK)    ││ id (PK)  ││ id (PK)  │
       │           │ ticketId   ││ ticketId   ││ ticketId ││ ticketId │
       │           │ message    ││ filename   ││ type     ││ fromLevel│
       │           │ isInternal ││ originalNm ││ result   ││ toLevel  │
       │           │ isSystem   ││ mimeType   ││ confidence││ reason  │
       │           │ senderUsrId││ size       ││ feedback ││ fromUsrId│
       │           │ createdAt  ││ s3Key      ││ createdAt││ toUserId │
       │           └────────────┘│ url        │└──────────┘│ isAuto   │
       │                         │ ocrText    │            │ createdAt│
       │                         │ uploadedBy │            └──────────┘
       │                         └────────────┘
       │
       │         ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
       │         │  AuditLog   │    │ Suggestion  │    │  Embedding  │
       │         ├─────────────┤    ├─────────────┤    ├─────────────┤
       │         │ id (PK)     │    │ id (PK)     │    │ id (PK)     │
       └────────▶│ userId (FK) │    │ title       │    │ ticketId    │
                 │ action      │    │ description │    │ vector      │
                 │ entityType  │    │ category    │    │ modelVersion│
                 │ entityId    │    │ status      │    │ createdAt   │
                 │ oldValue    │    │ upvotes     │    └─────────────┘
                 │ newValue    │    │ isFeatured  │
                 │ ipAddress   │    │ adminNote   │
                 │ userAgent   │    │ createdBy   │
                 │ createdAt   │    │ reviewedBy  │
                 └─────────────┘    │ collegeId   │
                                    │ departmentId│
                                    │ createdAt   │
                                    │ reviewedAt  │
                                    └─────────────┘
```

## Tables Overview

### Core Entities

| Table | Description | Row Count (Est.) |
|-------|-------------|------------------|
| `User` | All system users | 10,000+ |
| `Role` | System roles | 9 (fixed) |
| `UserRole` | User-role assignments | 15,000+ |
| `Campus` | Educational campuses | 1-3 |
| `College` | Colleges in campus | 4-8 |
| `Department` | Academic departments | 20-50 |
| `Ticket` | Complaints & issues | 50,000+ |
| `TicketMessage` | Ticket conversations | 200,000+ |
| `Attachment` | File uploads | 30,000+ |
| `Suggestion` | Public suggestions | 5,000+ |

### AI & Analytics

| Table | Description | Row Count (Est.) |
|-------|-------------|------------------|
| `AiPrediction` | AI analysis results | 100,000+ |
| `AiFeedback` | User feedback on AI | 20,000+ |
| `Embedding` | Vector embeddings | 50,000+ |
| `Escalation` | Escalation history | 15,000+ |
| `AuditLog` | System audit trail | 500,000+ |

## Enums

### RoleName
```sql
CREATE TYPE "RoleName" AS ENUM (
  'STUDENT',
  'STAFF',
  'HOD',
  'DIRECTOR',
  'TRANSPORT_INCHARGE',
  'HOSTEL_WARDEN',
  'MODERATOR',
  'CAMPUS_ADMIN',
  'SYSTEM_ADMIN'
);
```

### UserStatus
```sql
CREATE TYPE "UserStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION'
);
```

### TicketType
```sql
CREATE TYPE "TicketType" AS ENUM (
  'COMPLAINT',
  'QUERY',
  'REQUEST',
  'FEEDBACK'
);
```

### TicketCategory
```sql
CREATE TYPE "TicketCategory" AS ENUM (
  'ACADEMIC',
  'ADMINISTRATIVE',
  'INFRASTRUCTURE',
  'HOSTEL',
  'TRANSPORT',
  'LIBRARY',
  'EXAMINATION',
  'FEES',
  'RAGGING',
  'FACULTY',
  'OTHER'
);
```

### TicketPriority
```sql
CREATE TYPE "TicketPriority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);
```

### TicketStatus
```sql
CREATE TYPE "TicketStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'ESCALATED',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
  'REOPENED'
);
```

### TicketCurrentLevel
```sql
CREATE TYPE "TicketCurrentLevel" AS ENUM (
  'HOD',
  'DIRECTOR',
  'TRANSPORT_INCHARGE',
  'HOSTEL_WARDEN',
  'CAMPUS_ADMIN'
);
```

## Indexes

### Performance Indexes
```sql
-- User lookups
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_studentId_idx" ON "User"("studentId");
CREATE INDEX "User_employeeId_idx" ON "User"("employeeId");
CREATE INDEX "User_collegeId_idx" ON "User"("collegeId");

-- Ticket queries
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "Ticket_category_idx" ON "Ticket"("category");
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");
CREATE INDEX "Ticket_createdByUserId_idx" ON "Ticket"("createdByUserId");
CREATE INDEX "Ticket_assignedToUserId_idx" ON "Ticket"("assignedToUserId");
CREATE INDEX "Ticket_collegeId_idx" ON "Ticket"("collegeId");
CREATE INDEX "Ticket_departmentId_idx" ON "Ticket"("departmentId");
CREATE INDEX "Ticket_slaDueAt_idx" ON "Ticket"("slaDueAt");
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- Vector similarity search (pgvector)
CREATE INDEX "Embedding_vector_idx" ON "Embedding" 
  USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);

-- Audit log queries
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
```

## Foreign Key Relationships

```
User.campusId → Campus.id
User.collegeId → College.id
User.departmentId → Department.id

College.campusId → Campus.id
College.directorUserId → User.id

Department.collegeId → College.id
Department.hodUserId → User.id

UserRole.userId → User.id
UserRole.roleId → Role.id

Ticket.createdByUserId → User.id
Ticket.assignedToUserId → User.id
Ticket.collegeId → College.id
Ticket.departmentId → Department.id
Ticket.campusId → Campus.id

TicketMessage.ticketId → Ticket.id
TicketMessage.senderUserId → User.id

Attachment.ticketId → Ticket.id
Attachment.uploadedByUserId → User.id

AiPrediction.ticketId → Ticket.id

AiFeedback.predictionId → AiPrediction.id
AiFeedback.userId → User.id

Escalation.ticketId → Ticket.id
Escalation.fromUserId → User.id
Escalation.toUserId → User.id

AuditLog.userId → User.id

Suggestion.createdByUserId → User.id
Suggestion.reviewedByUserId → User.id
Suggestion.collegeId → College.id
Suggestion.departmentId → Department.id

Embedding.ticketId → Ticket.id
```

## Data Retention

| Data Type | Retention Period | Action |
|-----------|------------------|--------|
| Tickets | Indefinite | Archive after 3 years |
| Messages | Indefinite | Archive with ticket |
| Attachments | 5 years | Delete S3 objects |
| Audit Logs | 7 years | Archive to cold storage |
| Embeddings | 2 years | Regenerate as needed |
| AI Predictions | 2 years | Archive |

## Backup Strategy

- **Full backup**: Daily at 2:00 AM IST
- **Incremental**: Every 6 hours
- **WAL archiving**: Continuous
- **Retention**: 30 days rolling + monthly archives
- **Cross-region replication**: Enabled for DR

