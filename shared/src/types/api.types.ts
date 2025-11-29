// ===========================================
// API Response Types
// ===========================================

export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: IApiError;
  meta?: IApiMeta;
}

export interface IApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface IApiMeta {
  timestamp: string;
  requestId?: string;
  version?: string;
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: IPagination;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ===========================================
// Common Error Codes
// ===========================================

export enum ErrorCode {
  // Authentication Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  MFA_REQUIRED = 'MFA_REQUIRED',
  MFA_INVALID = 'MFA_INVALID',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Rate Limiting
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // File Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',

  // Ticket Errors
  TICKET_CLOSED = 'TICKET_CLOSED',
  TICKET_ALREADY_RATED = 'TICKET_ALREADY_RATED',
  CANNOT_ESCALATE = 'CANNOT_ESCALATE',
  INVALID_ASSIGNMENT = 'INVALID_ASSIGNMENT',

  // AI Errors
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_RATE_LIMITED = 'AI_RATE_LIMITED',
}

// ===========================================
// HTTP Status Codes
// ===========================================

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ===========================================
// Analytics Types
// ===========================================

export interface IAnalyticsOverview {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTimeHours: number;
  slaBreachRate: number;
  averageRating: number;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  ticketsByStatus: Record<string, number>;
}

export interface IAnalyticsByPeriod {
  period: string;
  ticketsCreated: number;
  ticketsResolved: number;
  averageResolutionTime: number;
  slaBreaches: number;
}

export interface IAnalyticsHeatmap {
  dayOfWeek: number;
  hourOfDay: number;
  count: number;
}

export interface ISatisfactionAnalytics {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: Record<string, number>;
  ratingsByCategory: Record<string, number>;
  ratingsByDepartment: Record<string, number>;
}

