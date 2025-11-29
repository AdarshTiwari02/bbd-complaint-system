# Sequence Diagrams

## 1. Ticket Creation with AI Classification

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as AI Service
    participant Q as BullMQ
    participant DB as PostgreSQL

    U->>F: Fill complaint form
    F->>AI: POST /ai/classify (description)
    AI-->>F: Category suggestion + confidence
    F->>AI: POST /ai/priority (description)
    AI-->>F: Priority suggestion + SLA hours
    F->>U: Show AI suggestions
    U->>F: Confirm & Submit
    F->>B: POST /api/v1/tickets
    B->>B: Generate ticket number
    B->>B: Route to handler (TicketRoutingService)
    B->>DB: Save ticket
    B->>Q: Queue AI jobs (summarize, embed, moderate)
    Q->>AI: Process summarization
    Q->>AI: Generate embedding
    Q->>AI: Check toxicity
    AI-->>Q: Results
    Q->>DB: Update ticket with AI data
    B-->>F: Ticket created (ticketNumber)
    F-->>U: Show success + ticket number
```

## 2. Escalation Flow

```mermaid
sequenceDiagram
    participant HOD as HOD
    participant B as Backend
    participant RS as RoutingService
    participant DB as PostgreSQL
    participant N as NotificationQueue
    participant D as Director

    HOD->>B: POST /api/v1/tickets/:id/escalate
    B->>RS: escalateTicket(ticketId, reason)
    RS->>RS: Get next routing level (DIRECTOR)
    RS->>DB: Find College Director
    RS->>DB: Create Escalation record
    RS->>DB: Update ticket (status=ESCALATED, level=DIRECTOR)
    RS->>DB: Create system message
    B->>N: Queue notification to Director
    N-->>D: Email/In-app notification
    B-->>HOD: Escalation successful
```

## 3. AI Reply Draft Generation

```mermaid
sequenceDiagram
    participant H as Handler (HOD/Director)
    participant F as Frontend
    participant B as Backend
    participant AI as AI Service
    participant DB as PostgreSQL

    H->>F: Click "Generate AI Reply"
    F->>B: GET /api/v1/tickets/:id/reply-draft
    B->>DB: Get ticket + messages
    B->>AI: POST /ai/generate-reply
    Note over AI: Analyze context<br/>Generate empathetic response
    AI-->>B: {subject, body, suggestedActions}
    B-->>F: Reply draft
    F-->>H: Show editable draft
    H->>H: Review and edit
    H->>F: Send reply
    F->>B: POST /api/v1/tickets/:id/messages
    B->>DB: Save message
    B-->>F: Message sent
```

## 4. OCR Processing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Backend
    participant S3 as MinIO/S3
    participant Q as BullMQ
    participant W as OCR Worker
    participant AI as AI Service
    participant DB as PostgreSQL

    U->>B: Upload image/PDF
    B->>B: Validate file type/size
    B->>S3: Store file
    S3-->>B: S3 key + URL
    B->>DB: Create Attachment record
    B->>Q: Queue OCR job
    Q->>W: Process job
    W->>S3: Download file
    W->>AI: POST /ai/ocr
    AI->>AI: Extract text (Tesseract)
    AI-->>W: Extracted text
    W->>DB: Update attachment.ocrText
    W-->>Q: Job complete
```

## 5. User Registration & Login

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL
    participant N as NotificationQueue

    Note over U,N: Registration
    U->>F: Fill registration form
    F->>B: POST /api/v1/auth/register
    B->>DB: Check email exists
    B->>B: Hash password (bcrypt)
    B->>DB: Create user (PENDING_VERIFICATION)
    B->>DB: Assign default role
    B->>N: Queue verification email
    B-->>F: Registration successful
    F-->>U: Check email message

    Note over U,N: Login
    U->>F: Enter credentials
    F->>B: POST /api/v1/auth/login
    B->>DB: Find user by email
    B->>B: Verify password
    alt MFA Enabled
        B-->>F: MFA required
        U->>F: Enter MFA code
        F->>B: POST /api/v1/auth/login (with code)
        B->>B: Verify TOTP
    end
    B->>B: Generate JWT tokens
    B->>DB: Store refresh token
    B->>DB: Update lastLoginAt
    B-->>F: User + tokens
    F->>F: Store tokens (localStorage)
    F-->>U: Redirect to dashboard
```

## 6. Duplicate Detection Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as AI Service
    participant DB as PostgreSQL

    U->>F: Type complaint description
    Note over F: Debounce input
    F->>B: GET /api/v1/ai/similar?text=...
    B->>AI: POST /ai/embeddings
    AI-->>B: Vector embedding
    B->>DB: Query embeddings table
    Note over DB: Cosine similarity search
    DB-->>B: Similar tickets
    B-->>F: List of duplicates
    F-->>U: "Similar tickets found:"
    U->>U: Review existing tickets
    U->>F: Continue or cancel submission
```

## 7. Public Ticket Tracking

```mermaid
sequenceDiagram
    participant V as Visitor
    participant F as Frontend
    participant B as Backend
    participant DB as PostgreSQL

    V->>F: Enter ticket number
    F->>B: GET /api/v1/tickets/track/:number
    Note over B: Public endpoint (no auth)
    B->>DB: Find ticket by number
    B->>B: Filter sensitive data
    B-->>F: Status, timeline, SLA info
    F-->>V: Display progress tracker
```

## 8. Auto-Escalation (SLA Breach)

```mermaid
sequenceDiagram
    participant C as Cron Job
    participant RS as RoutingService
    participant DB as PostgreSQL
    participant N as NotificationQueue
    participant A as Campus Admin

    Note over C: Runs every 15 minutes
    C->>RS: checkAndAutoEscalate()
    RS->>DB: Find breached tickets
    Note over DB: slaDueAt < now<br/>status not resolved<br/>level not CAMPUS_ADMIN
    loop For each breached ticket
        RS->>RS: escalateTicket(auto=true)
        RS->>DB: Create Escalation record
        RS->>DB: Update ticket level
        RS->>N: Queue notification
    end
    N-->>A: Alert: SLA breach escalations
    RS-->>C: Escalated count
```

