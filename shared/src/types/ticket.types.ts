// ===========================================
// Ticket Types
// ===========================================

export enum TicketCategory {
  TRANSPORT = 'TRANSPORT',
  HOSTEL = 'HOSTEL',
  ACADEMIC = 'ACADEMIC',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  OTHER = 'OTHER',
}

export enum TicketType {
  COMPLAINT = 'COMPLAINT',
  SUGGESTION = 'SUGGESTION',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_INFO = 'PENDING_INFO',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export enum RoutingLevel {
  HOD = 'HOD',
  DIRECTOR = 'DIRECTOR',
  CAMPUS_ADMIN = 'CAMPUS_ADMIN',
  TRANSPORT_INCHARGE = 'TRANSPORT_INCHARGE',
  HOSTEL_WARDEN = 'HOSTEL_WARDEN',
}

export interface ITicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  createdByUserId: string;
  isAnonymous: boolean;
  anonymousIdentifier?: string;
  category: TicketCategory;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  collegeId?: string;
  departmentId?: string;
  assignedToUserId?: string;
  currentLevel?: RoutingLevel;
  slaDueAt?: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  rating?: number;
  ratingComment?: string;
  ratedAt?: Date;
  aiCategoryConfidence?: number;
  aiPriorityConfidence?: number;
  summary?: string;
  isToxic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicketWithRelations extends ITicket {
  createdBy?: ITicketUser;
  assignedTo?: ITicketUser;
  college?: ITicketOrg;
  department?: ITicketOrg;
  messages?: ITicketMessage[];
  attachments?: IAttachment[];
  escalations?: IEscalation[];
}

export interface ITicketUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface ITicketOrg {
  id: string;
  name: string;
  code: string;
}

export interface ITicketMessage {
  id: string;
  ticketId: string;
  senderUserId?: string;
  sender?: ITicketUser;
  message: string;
  isInternal: boolean;
  isSystem: boolean;
  isAiGenerated: boolean;
  attachments?: IAttachment[];
  createdAt: Date;
}

export interface IAttachment {
  id: string;
  ticketId?: string;
  messageId?: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  url: string;
  ocrText?: string;
  ocrProcessed: boolean;
  createdAt: Date;
}

export interface IEscalation {
  id: string;
  ticketId: string;
  fromRole: RoutingLevel;
  toRole: RoutingLevel;
  fromUserId?: string;
  toUserId?: string;
  fromUser?: ITicketUser;
  toUser?: ITicketUser;
  reason?: string;
  autoEscalated: boolean;
  createdAt: Date;
}

export interface ICreateTicketRequest {
  title: string;
  description: string;
  category: TicketCategory;
  type: TicketType;
  isAnonymous?: boolean;
  collegeId?: string;
  departmentId?: string;
  priority?: TicketPriority;
  tags?: string[];
  attachmentIds?: string[];
}

export interface IUpdateTicketRequest {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToUserId?: string;
  tags?: string[];
}

export interface ICreateMessageRequest {
  message: string;
  isInternal?: boolean;
  attachmentIds?: string[];
}

export interface IEscalateRequest {
  reason: string;
}

export interface IRateTicketRequest {
  rating: number;
  comment?: string;
}

export interface ITicketFilters {
  status?: TicketStatus[];
  category?: TicketCategory[];
  priority?: TicketPriority[];
  type?: TicketType;
  collegeId?: string;
  departmentId?: string;
  assignedToUserId?: string;
  createdByUserId?: string;
  isAnonymous?: boolean;
  isToxic?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ITicketTimeline {
  type: 'status_change' | 'escalation' | 'assignment' | 'message' | 'rating';
  timestamp: Date;
  data: Record<string, unknown>;
  userId?: string;
  user?: ITicketUser;
}

export interface ISuggestion {
  id: string;
  ticketId: string;
  ticket?: ITicket;
  isPublic: boolean;
  isApprovedByModerator: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
}

// SLA Configuration (in hours)
export const SLA_HOURS: Record<TicketPriority, number> = {
  [TicketPriority.LOW]: 72,
  [TicketPriority.MEDIUM]: 48,
  [TicketPriority.HIGH]: 24,
  [TicketPriority.CRITICAL]: 6,
};

