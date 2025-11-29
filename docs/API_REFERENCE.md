# API Reference

Base URL: `http://localhost:3001/api/v1`

## Authentication

All authenticated endpoints require Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Auth Module

### POST `/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "studentId": "BBDU2024001",
  "employeeId": null,
  "phone": "+91-9876543210",
  "collegeId": "uuid",
  "departmentId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "PENDING_VERIFICATION"
  },
  "message": "Registration successful. Please verify your email."
}
```

---

### POST `/auth/login`
Authenticate user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "mfaCode": "123456"  // Optional, required if MFA enabled
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["STUDENT"]
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### POST `/auth/refresh`
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### POST `/auth/logout`
Logout and invalidate refresh token.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`

---

### POST `/auth/forgot-password`
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

---

### POST `/auth/reset-password`
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`

---

## Tickets Module

### POST `/tickets`
Create a new ticket.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "title": "WiFi not working in hostel",
  "description": "The WiFi has been down for 3 days...",
  "category": "HOSTEL",
  "type": "COMPLAINT",
  "priority": "HIGH",
  "isAnonymous": false,
  "collegeId": "uuid",
  "departmentId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketNumber": "TKT-2024-00001",
    "title": "WiFi not working in hostel",
    "status": "OPEN",
    "priority": "HIGH",
    "currentLevel": "HOSTEL_WARDEN",
    "slaDueAt": "2024-11-30T10:00:00Z"
  }
}
```

---

### GET `/tickets`
List tickets (filtered by user role).

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (OPEN, IN_PROGRESS, ESCALATED, RESOLVED, CLOSED)
- `category` (ACADEMIC, ADMINISTRATIVE, etc.)
- `priority` (LOW, MEDIUM, HIGH, URGENT)
- `search` (string)
- `collegeId` (uuid)
- `departmentId` (uuid)
- `assignedToMe` (boolean)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### GET `/tickets/:id`
Get ticket details.

**Headers:** `Authorization: Bearer <access_token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketNumber": "TKT-2024-00001",
    "title": "WiFi not working",
    "description": "...",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "category": "HOSTEL",
    "currentLevel": "HOSTEL_WARDEN",
    "createdBy": { "id": "...", "firstName": "...", "lastName": "..." },
    "assignedTo": { "id": "...", "firstName": "...", "lastName": "..." },
    "college": { "id": "...", "name": "..." },
    "department": { "id": "...", "name": "..." },
    "messages": [...],
    "attachments": [...],
    "escalations": [...],
    "aiPredictions": [...],
    "createdAt": "...",
    "updatedAt": "...",
    "slaDueAt": "..."
  }
}
```

---

### PUT `/tickets/:id`
Update ticket.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "assignedToUserId": "uuid"
}
```

---

### POST `/tickets/:id/messages`
Add message to ticket thread.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "message": "We are looking into this issue.",
  "isInternal": false
}
```

---

### POST `/tickets/:id/escalate`
Escalate ticket to next level.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "reason": "Requires higher authority approval"
}
```

---

### POST `/tickets/:id/rate`
Rate resolved ticket.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "rating": 4,
  "feedback": "Issue resolved quickly"
}
```

---

### GET `/tickets/track/:ticketNumber` (Public)
Track ticket status publicly.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "ticketNumber": "TKT-2024-00001",
    "title": "WiFi not working",
    "status": "IN_PROGRESS",
    "statusDisplay": "Being Worked On",
    "category": "HOSTEL",
    "priority": "HIGH",
    "createdAt": "...",
    "timeline": [
      { "status": "OPEN", "timestamp": "...", "message": "Ticket created" },
      { "status": "IN_PROGRESS", "timestamp": "...", "message": "Assigned to handler" }
    ],
    "sla": {
      "dueAt": "...",
      "isBreached": false
    }
  }
}
```

---

## Organization Module

### GET `/organization/campuses`
List all campuses.

### GET `/organization/colleges`
List all colleges.

**Query Parameters:**
- `campusId` (uuid, optional)

### GET `/organization/departments`
List all departments.

**Query Parameters:**
- `collegeId` (uuid, optional)

---

## AI Module

### POST `/ai/classify`
Classify ticket category.

**Request Body:**
```json
{
  "title": "AC not working in classroom",
  "description": "The air conditioner in Room 305..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "INFRASTRUCTURE",
    "confidence": 0.92,
    "reasoning": "Issue relates to physical infrastructure..."
  }
}
```

### POST `/ai/priority`
Predict ticket priority.

### POST `/ai/moderate`
Check content for toxicity.

### POST `/ai/reply`
Generate reply draft.

### POST `/ai/summarize`
Summarize ticket conversation.

### POST `/ai/chatbot`
Conversational ticket intake.

---

## Analytics Module

### GET `/analytics/overview`
Get dashboard overview metrics.

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `startDate` (ISO date)
- `endDate` (ISO date)
- `collegeId` (uuid, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 1250,
    "openTickets": 45,
    "resolvedToday": 12,
    "avgResolutionTime": 18.5,
    "satisfactionScore": 4.2,
    "ticketsByStatus": {
      "OPEN": 45,
      "IN_PROGRESS": 32,
      "RESOLVED": 1100,
      "CLOSED": 73
    },
    "ticketsByCategory": {
      "ACADEMIC": 400,
      "HOSTEL": 300,
      "TRANSPORT": 200,
      ...
    },
    "trendsThisWeek": [...],
    "slaCompliance": 92.5
  }
}
```

### GET `/analytics/by-college`
Get metrics grouped by college.

### GET `/analytics/sla`
Get SLA compliance metrics.

### GET `/analytics/satisfaction`
Get satisfaction ratings.

### GET `/analytics/heatmap`
Get ticket volume heatmap data.

### GET `/analytics/ai-insights`
Get AI-generated insights.

---

## Files Module

### POST `/files/upload`
Upload file attachment.

**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file` - File to upload
- `ticketId` - Associated ticket ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "screenshot.png",
    "originalName": "Screenshot 2024-01-15.png",
    "mimeType": "image/png",
    "size": 245760,
    "url": "https://..."
  }
}
```

---

## Suggestions Module

### GET `/suggestions`
List public suggestions.

**Query Parameters:**
- `page`, `limit`
- `status` (PENDING, APPROVED, IMPLEMENTED, REJECTED)
- `collegeId`

### POST `/suggestions`
Submit new suggestion.

### POST `/suggestions/:id/upvote`
Upvote a suggestion.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/auth/register"
}
```

### Common Error Codes
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

