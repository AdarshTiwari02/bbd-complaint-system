export const ROLE_PERMISSIONS = {
  STUDENT: ['ticket:create', 'ticket:read'],
  STAFF: ['ticket:create', 'ticket:read'],
  HOD: [
    'ticket:create',
    'ticket:read',
    'ticket:update',
    'ticket:assign',
    'ticket:escalate',
    'ticket:resolve',
    'analytics:view',
  ],
  DIRECTOR: [
    'ticket:create',
    'ticket:read',
    'ticket:read:all',
    'ticket:update',
    'ticket:assign',
    'ticket:escalate',
    'ticket:resolve',
    'ticket:close',
    'analytics:view',
    'analytics:export',
  ],
  TRANSPORT_INCHARGE: [
    'ticket:read',
    'ticket:update',
    'ticket:assign',
    'ticket:escalate',
    'ticket:resolve',
  ],
  HOSTEL_WARDEN: [
    'ticket:read',
    'ticket:update',
    'ticket:assign',
    'ticket:escalate',
    'ticket:resolve',
  ],
  MODERATOR: [
    'ticket:read',
    'ticket:read:all',
    'moderation:view',
    'moderation:approve',
    'moderation:reject',
    'suggestion:approve',
    'suggestion:feature',
  ],
  CAMPUS_ADMIN: [
    'ticket:create',
    'ticket:read',
    'ticket:read:all',
    'ticket:update',
    'ticket:delete',
    'ticket:assign',
    'ticket:escalate',
    'ticket:resolve',
    'ticket:close',
    'ticket:reopen',
    'user:read',
    'user:update',
    'user:manage-roles',
    'org:read',
    'org:update',
    'analytics:view',
    'analytics:export',
    'moderation:view',
    'moderation:approve',
    'moderation:reject',
    'suggestion:approve',
    'suggestion:feature',
  ],
  SYSTEM_ADMIN: ['admin:full-access', 'system:config'],
} as const;

// SLA_HOURS moved to types/ticket.types.ts to match TicketPriority enum

export const ESCALATION_SLA_HOURS = {
  URGENT: 2,
  HIGH: 12,
  MEDIUM: 24,
  LOW: 48,
} as const;

export const TICKET_NUMBER_PREFIX = 'TKT';

export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const EMBEDDING_MODEL_VERSION = 'gemini-1.5-pro';
export const SIMILARITY_THRESHOLD = 0.85;

