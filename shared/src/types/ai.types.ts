// ===========================================
// AI Types
// ===========================================

import { TicketCategory, TicketPriority, RoutingLevel } from './ticket.types';

export enum AiPredictionType {
  CATEGORIZATION = 'CATEGORIZATION',
  PRIORITY = 'PRIORITY',
  TOXICITY = 'TOXICITY',
  SUMMARY = 'SUMMARY',
  TREND = 'TREND',
  DUPLICATE = 'DUPLICATE',
  REPLY_DRAFT = 'REPLY_DRAFT',
}

export enum ToxicitySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum ToxicityAction {
  ALLOW = 'ALLOW',
  FLAG = 'FLAG',
  BLOCK = 'BLOCK',
}

// ===========================================
// Classification Request/Response
// ===========================================

export interface IClassifyTicketRequest {
  text: string;
  title?: string;
  college?: string;
  department?: string;
  additionalContext?: string;
}

export interface IClassifyTicketResponse {
  category: TicketCategory;
  confidence: number;
  suggestedDepartment?: string;
  suggestedRoutingLevel: RoutingLevel;
  reasoning?: string;
}

// ===========================================
// Priority Prediction Request/Response
// ===========================================

export interface IPredictPriorityRequest {
  text: string;
  title?: string;
  category?: TicketCategory;
}

export interface IPredictPriorityResponse {
  priority: TicketPriority;
  confidence: number;
  slaHours: number;
  reasoning?: string;
}

// ===========================================
// Toxicity/Moderation Request/Response
// ===========================================

export interface IModerateContentRequest {
  text: string;
  checkSpam?: boolean;
  checkProfanity?: boolean;
  checkHarassment?: boolean;
}

export interface IModerateContentResponse {
  isToxic: boolean;
  severity: ToxicitySeverity;
  recommendedAction: ToxicityAction;
  categories: {
    spam: boolean;
    profanity: boolean;
    harassment: boolean;
    hate: boolean;
    threat: boolean;
  };
  confidence: number;
  reasoning?: string;
}

// ===========================================
// Reply Draft Request/Response
// ===========================================

export interface IGenerateReplyRequest {
  ticketTitle: string;
  ticketDescription: string;
  conversationHistory: Array<{
    role: 'user' | 'staff';
    message: string;
    timestamp: Date;
  }>;
  ticketCategory: TicketCategory;
  responderRole: string;
  tone?: 'formal' | 'friendly' | 'empathetic';
}

export interface IGenerateReplyResponse {
  subject: string;
  body: string;
  suggestedActions?: string[];
  confidence: number;
}

// ===========================================
// Summary Request/Response
// ===========================================

export interface ISummarizeTicketRequest {
  ticketTitle: string;
  ticketDescription: string;
  messages?: Array<{
    role: 'user' | 'staff';
    message: string;
  }>;
  maxLength?: number;
}

export interface ISummarizeTicketResponse {
  shortSummary: string;
  detailedSummary?: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

// ===========================================
// Embedding Request/Response
// ===========================================

export interface IGenerateEmbeddingRequest {
  text: string;
  model?: string;
}

export interface IGenerateEmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

// ===========================================
// Similar Tickets Request/Response
// ===========================================

export interface IFindSimilarTicketsRequest {
  text: string;
  limit?: number;
  threshold?: number;
  excludeTicketIds?: string[];
}

export interface ISimilarTicket {
  ticketId: string;
  ticketNumber: string;
  title: string;
  similarity: number;
  status: string;
  category: string;
}

export interface IFindSimilarTicketsResponse {
  tickets: ISimilarTicket[];
  searchText: string;
}

// ===========================================
// OCR Request/Response
// ===========================================

export interface IOcrRequest {
  fileUrl: string;
  mimeType: string;
  language?: string;
}

export interface IOcrResponse {
  text: string;
  confidence: number;
  language?: string;
  blocks?: Array<{
    text: string;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

// ===========================================
// Trend Analysis Request/Response
// ===========================================

export interface IAnalyzeTrendsRequest {
  tickets: Array<{
    id: string;
    title: string;
    description: string;
    category: TicketCategory;
    tags: string[];
    createdAt: Date;
  }>;
  timeRange?: {
    from: Date;
    to: Date;
  };
}

export interface ITrendCluster {
  theme: string;
  count: number;
  percentage: number;
  keywords: string[];
  examples: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface IAnalyzeTrendsResponse {
  clusters: ITrendCluster[];
  topIssues: Array<{
    issue: string;
    frequency: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
  summary: string;
}

// ===========================================
// Chatbot Types
// ===========================================

export interface IChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatbotIntakeRequest {
  messages: IChatbotMessage[];
  currentStep?: string;
}

export interface IChatbotIntakeResponse {
  message: string;
  nextStep?: string;
  isComplete: boolean;
  extractedData?: {
    category?: TicketCategory;
    college?: string;
    department?: string;
    title?: string;
    description?: string;
    priority?: TicketPriority;
    type?: 'complaint' | 'suggestion';
  };
}

// ===========================================
// AI Prediction Storage
// ===========================================

export interface IAiPrediction {
  id: string;
  ticketId: string;
  type: AiPredictionType;
  rawResponse?: string;
  parsedJson?: Record<string, unknown>;
  modelName: string;
  confidence?: number;
  processingMs?: number;
  createdAt: Date;
}

export interface IAiFeedback {
  id: string;
  aiPredictionId: string;
  userId: string;
  isUseful: boolean;
  comment?: string;
  createdAt: Date;
}

