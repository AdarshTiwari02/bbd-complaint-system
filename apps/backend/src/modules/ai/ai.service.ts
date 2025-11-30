import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { WinstonLoggerService } from '../../common/logger/winston-logger.service';
import { TicketCategory } from '@prisma/client';

export interface ClassifyResponse {
  category: string;
  confidence: number;
  suggestedDepartment?: string;
  suggestedRoutingLevel: string;
}

export interface PriorityResponse {
  priority: string;
  confidence: number;
  slaHours: number;
}

export interface ModerateResponse {
  isToxic: boolean;
  severity: string;
  recommendedAction: string;
  categories: {
    spam: boolean;
    profanity: boolean;
    harassment: boolean;
    hate: boolean;
    threat: boolean;
  };
  confidence: number;
}

export interface SummaryResponse {
  shortSummary: string;
  detailedSummary?: string;
  keyPoints: string[];
  sentiment: string;
}

export interface ReplyDraftResponse {
  subject: string;
  body: string;
  suggestedActions?: string[];
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface SimilarTicket {
  ticketId: string;
  ticketNumber: string;
  title: string;
  similarity: number;
  status: string;
  category: string;
}

@Injectable()
export class AiService {
  private readonly aiServiceUrl: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:3002');
    const apiKey = this.configService.get('AI_SERVICE_API_KEY');
    
    // Create axios instance with API key header
    this.axiosInstance = axios.create({
      baseURL: this.aiServiceUrl,
      headers: apiKey ? { 'X-API-Key': apiKey } : {},
    });
  }

  async classifyTicket(text: string, title?: string, college?: string, department?: string): Promise<ClassifyResponse> {
    try {
      const response = await this.axiosInstance.post('/ai/classify-ticket', {
        text,
        title,
        college,
        department,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('classifyTicket', error);
      throw error;
    }
  }

  async predictPriority(text: string, title?: string, category?: TicketCategory): Promise<PriorityResponse> {
    try {
      const response = await this.axiosInstance.post('/ai/predict-priority', {
        text,
        title,
        category,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('predictPriority', error);
    }
  }

  async moderateContent(text: string): Promise<ModerateResponse> {
    try {
      const response = await this.axiosInstance.post('/ai/moderate', {
        text,
        checkSpam: true,
        checkProfanity: true,
        checkHarassment: true,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('moderateContent', error);
    }
  }

  async summarizeTicket(ticketTitle: string, ticketDescription: string, messages?: Array<{ role: string; message: string }>): Promise<SummaryResponse> {
    try {
      const response = await this.axiosInstance.post('/ai/summarize-ticket', {
        ticketTitle,
        ticketDescription,
        messages,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('summarizeTicket', error);
    }
  }

  async generateReplyDraft(params: {
    ticketTitle: string;
    ticketDescription: string;
    conversationHistory: Array<{ role: 'user' | 'staff'; message: string; timestamp: Date }>;
    ticketCategory: TicketCategory;
    responderRole: string;
    tone?: 'formal' | 'friendly' | 'empathetic';
  }): Promise<ReplyDraftResponse> {
    try {
      const response = await this.axiosInstance.post('/ai/generate-reply', params);
      return response.data.data;
    } catch (error) {
      this.handleError('generateReplyDraft', error);
    }
  }

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    try {
      const response = await this.axiosInstance.post('/ai/embeddings', { text });
      return response.data.data;
    } catch (error) {
      this.handleError('generateEmbedding', error);
    }
  }

  async findSimilarTickets(ticketId: string, limit: number = 5, threshold: number = 0.7): Promise<SimilarTicket[]> {
    try {
      // Get the ticket embedding
      const embedding = await this.prisma.embedding.findUnique({
        where: { ticketId },
      });

      if (!embedding || !embedding.vectorJson.length) {
        // Generate embedding if not exists
        const ticket = await this.prisma.ticket.findUnique({
          where: { id: ticketId },
        });

        if (!ticket) {
          return [];
        }

        const embeddingResult = await this.generateEmbedding(
          `${ticket.title}\n\n${ticket.description}`,
        );

        await this.prisma.embedding.upsert({
          where: { ticketId },
          create: {
            ticketId,
            vectorJson: embeddingResult.embedding,
            modelName: embeddingResult.model,
          },
          update: {
            vectorJson: embeddingResult.embedding,
            modelName: embeddingResult.model,
          },
        });
      }

      // Call AI service to find similar
      const response = await this.axiosInstance.post('/ai/similar-tickets', {
        ticketId,
        limit,
        threshold,
      });

      return response.data.data.tickets;
    } catch (error) {
      this.handleError('findSimilarTickets', error);
      return [];
    }
  }

  async performOcr(fileUrl: string, mimeType: string): Promise<{ text: string; confidence: number }> {
    try {
      const response = await this.axiosInstance.post('/ai/ocr', {
        fileUrl,
        mimeType,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('performOcr', error);
    }
  }

  async analyzeTrends(tickets: Array<{
    id: string;
    title: string;
    description: string;
    category: TicketCategory;
    tags: string[];
    createdAt: Date;
  }>) {
    try {
      const response = await this.axiosInstance.post('/ai/trends', {
        tickets,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('analyzeTrends', error);
    }
  }

  async chatbotIntake(messages: Array<{ role: 'user' | 'assistant'; content: string }>, currentStep?: string) {
    try {
      const response = await this.axiosInstance.post('/ai/chatbot-intake', {
        messages,
        currentStep,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('chatbotIntake', error);
    }
  }

  async enhanceText(text: string, title?: string, type: 'complaint' | 'suggestion' = 'complaint') {
    try {
      const response = await this.axiosInstance.post('/ai/enhance-text', {
        text,
        title,
        type,
      });
      return response.data.data;
    } catch (error) {
      this.handleError('enhanceText', error);
    }
  }

  private handleError(method: string, error: unknown): never {
    if (error instanceof AxiosError) {
      this.logger.error(
        `AI Service error in ${method}: ${error.message}`,
        error.stack,
        'AiService',
      );
      throw new HttpException(
        error.response?.data?.message || 'AI service unavailable',
        error.response?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    throw error;
  }
}

