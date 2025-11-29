# Complaint Routing Logic

## Overview

The BBD Complaint System uses intelligent routing to ensure complaints reach the appropriate handler based on category and organizational structure.

## Routing Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLAINT SUBMISSION                                 │
│                                                                              │
│   Student/Staff submits complaint with:                                      │
│   - Category (Academic, Hostel, Transport, etc.)                            │
│   - College (BBDU, BBD NITM, BBD NIIT, BBD Dental)                         │
│   - Department (CSE, IT, ECE, etc.)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CATEGORY-BASED ROUTING                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐            │
│   │   TRANSPORT   │     │    HOSTEL     │     │    ACADEMIC   │            │
│   │   Category    │     │   Category    │     │   Categories  │            │
│   └───────┬───────┘     └───────┬───────┘     └───────┬───────┘            │
│           │                     │                     │                     │
│           ▼                     ▼                     ▼                     │
│   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐            │
│   │   TRANSPORT   │     │    HOSTEL     │     │      HOD      │            │
│   │   INCHARGE    │     │    WARDEN     │     │  (Department) │            │
│   └───────────────┘     └───────────────┘     └───────────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Routing Rules by Category

### Transport Complaints
```
TRANSPORT → Transport Incharge → Campus Admin
```
- Initial assignment: **Transport Incharge**
- Escalation path: **Campus Admin**
- SLA: 48 hours (High priority)

### Hostel Complaints
```
HOSTEL → Hostel Warden → Campus Admin
```
- Initial assignment: **Hostel Warden**
- Escalation path: **Campus Admin**
- SLA: 24 hours (High priority due to living conditions)

### Academic Complaints
```
ACADEMIC → Department HOD → College Director → Campus Admin
```
- Initial assignment: **HOD of the relevant department**
- Escalation Level 1: **College Director**
- Escalation Level 2: **Campus Admin**
- SLA: 72 hours (Standard)

### Administrative Complaints
```
ADMINISTRATIVE → HOD/Admin Officer → Director → Campus Admin
```
- Initial assignment: **Department HOD or Admin Officer**
- Escalation path: Same as academic
- SLA: 48 hours

### Infrastructure Complaints
```
INFRASTRUCTURE → HOD → Director → Campus Admin
```
- Initial assignment: **Department HOD**
- Escalation path: Director, then Campus Admin
- SLA: 72 hours

### Ragging Complaints (URGENT)
```
RAGGING → Director (immediate) + Campus Admin notified
```
- **Direct escalation** to College Director
- Campus Admin **immediately notified**
- SLA: **4 hours** (highest priority)
- Anonymous by default

### Other Categories
```
FEES, LIBRARY, EXAMINATION, FACULTY, OTHER → HOD → Director → Campus Admin
```

## Routing Implementation

```typescript
// ticket-routing.service.ts

determineInitialHandler(category: TicketCategory, collegeId: string, departmentId?: string) {
  switch (category) {
    case 'TRANSPORT':
      return {
        level: 'TRANSPORT_INCHARGE',
        handler: findTransportIncharge(collegeId)
      };
    
    case 'HOSTEL':
      return {
        level: 'HOSTEL_WARDEN',
        handler: findHostelWarden(collegeId)
      };
    
    case 'RAGGING':
      // Direct to Director with urgent priority
      return {
        level: 'DIRECTOR',
        handler: findCollegeDirector(collegeId),
        notifyAlso: [findCampusAdmins()]
      };
    
    default:
      // Academic, Administrative, Infrastructure, etc.
      return {
        level: 'HOD',
        handler: findDepartmentHOD(departmentId)
      };
  }
}
```

## Escalation Logic

### Automatic Escalation
Tickets are auto-escalated when:
1. **SLA breach**: Ticket exceeds due time without resolution
2. **No response**: No handler activity for > 24 hours
3. **User request**: Submitter explicitly requests escalation

### Escalation Levels

```
Level 1: HOD/Incharge/Warden
    │
    │ (Escalate)
    ▼
Level 2: College Director
    │
    │ (Escalate)
    ▼
Level 3: Campus Administrator
```

### Escalation Rules

| Current Level | Next Level | Condition |
|---------------|------------|-----------|
| HOD | DIRECTOR | SLA breach OR manual escalation |
| DIRECTOR | CAMPUS_ADMIN | SLA breach OR manual escalation |
| TRANSPORT_INCHARGE | CAMPUS_ADMIN | SLA breach OR manual escalation |
| HOSTEL_WARDEN | CAMPUS_ADMIN | SLA breach OR manual escalation |
| CAMPUS_ADMIN | (None) | Terminal level - must resolve |

## SLA Configuration

| Priority | Initial SLA | After Escalation |
|----------|-------------|------------------|
| URGENT | 4 hours | 2 hours |
| HIGH | 24 hours | 12 hours |
| MEDIUM | 48 hours | 24 hours |
| LOW | 72 hours | 48 hours |

## Handler Assignment Algorithm

```typescript
async findHandler(level: TicketCurrentLevel, context: RoutingContext) {
  // 1. Find users with the required role at the relevant org level
  const candidates = await findUsersWithRole(level, context);
  
  // 2. Filter by availability (not suspended, not on leave)
  const available = candidates.filter(u => u.status === 'ACTIVE');
  
  // 3. Load balance by current workload
  const sorted = available.sort((a, b) => 
    a.assignedTicketsCount - b.assignedTicketsCount
  );
  
  // 4. Return handler with lowest workload
  return sorted[0];
}
```

## Notification Flow

When a ticket is routed or escalated:

1. **New Handler**: Email + In-app notification
2. **Previous Handler**: Notification of handoff
3. **Submitter**: Status update notification
4. **Watchers**: If ticket has watchers, notify them

### Notification Templates

```
New Ticket Assignment:
  Subject: [ACTION REQUIRED] New ${category} complaint - ${ticketNumber}
  Body: A new complaint has been assigned to you...

Escalation:
  Subject: [ESCALATED] ${ticketNumber} requires your attention
  Body: This ticket has been escalated from ${previousHandler}...

SLA Warning:
  Subject: [SLA WARNING] ${ticketNumber} approaching deadline
  Body: This ticket is due in ${timeRemaining}...

SLA Breach:
  Subject: [URGENT] ${ticketNumber} has breached SLA
  Body: This ticket has exceeded its resolution deadline...
```

## Special Cases

### Cross-Department Complaints
If a complaint spans multiple departments:
1. Assign to primary department HOD
2. Copy/notify secondary department HOD
3. Both can collaborate on resolution

### Anonymous Complaints
- Handler sees complaint details but NOT submitter identity
- Identity stored in database for abuse prevention
- Only Campus Admin can unmask if legally required

### Duplicate Detection
Before routing:
1. AI checks for similar open tickets
2. If duplicate found (>85% similarity), suggest merging
3. User can confirm merge or proceed as new ticket

## Audit Trail

All routing decisions are logged:

```json
{
  "ticketId": "uuid",
  "action": "ASSIGNED",
  "fromLevel": null,
  "toLevel": "HOD",
  "fromUserId": null,
  "toUserId": "uuid",
  "reason": "Initial routing: Academic category",
  "isAutomatic": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

