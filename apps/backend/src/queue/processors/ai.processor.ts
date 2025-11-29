import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { WinstonLoggerService } from '../../common/logger/winston-logger.service';
import { QUEUE_AI } from '../queue.module';

export type AiJobType = 'classify' | 'priority' | 'moderate' | 'summarize' | 'embed';

export interface AiJobData {
  type: AiJobType;
  ticketId: string;
  text: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AiProcessor implements OnModuleInit {
  private worker: Worker;

  constructor(
    @Inject('BULLMQ_CONNECTION') private readonly connection: Redis,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async onModuleInit() {
    this.worker = new Worker<AiJobData>(
      QUEUE_AI,
      async (job: Job<AiJobData>) => {
        await this.processAiJob(job);
      },
      {
        connection: this.connection,
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`AI job ${job.id} completed`, 'AiProcessor');
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`AI job ${job?.id} failed: ${err.message}`, err.stack, 'AiProcessor');
    });
  }

  private async processAiJob(job: Job<AiJobData>) {
    const { type, ticketId, text, title, metadata } = job.data;
    const aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:3002');

    try {
      switch (type) {
        case 'classify':
          await this.processClassification(aiServiceUrl, ticketId, text, title);
          break;
        case 'priority':
          await this.processPriority(aiServiceUrl, ticketId, text, title);
          break;
        case 'moderate':
          await this.processModeration(aiServiceUrl, ticketId, text);
          break;
        case 'summarize':
          await this.processSummary(aiServiceUrl, ticketId, text, title);
          break;
        case 'embed':
          await this.processEmbedding(aiServiceUrl, ticketId, text);
          break;
      }
    } catch (error) {
      this.logger.error(
        `AI ${type} job failed for ticket ${ticketId}: ${(error as Error).message}`,
        (error as Error).stack,
        'AiProcessor',
      );
      throw error;
    }
  }

  private async processClassification(aiServiceUrl: string, ticketId: string, text: string, title?: string) {
    const response = await axios.post(`${aiServiceUrl}/ai/classify-ticket`, { text, title }, this.getAxiosConfig());
    const result = response.data.data;

    await this.prisma.aiPrediction.create({
      data: {
        ticketId,
        type: 'CATEGORIZATION',
        parsedJson: result,
        confidence: result.confidence,
        modelName: 'gemini-1.5-flash',
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        aiCategoryConfidence: result.confidence,
      },
    });
  }

  private getAxiosConfig() {
    const apiKey = this.configService.get('AI_SERVICE_API_KEY');
    return { headers: apiKey ? { 'X-API-Key': apiKey } : {} };
  }

  private async processPriority(aiServiceUrl: string, ticketId: string, text: string, title?: string) {
    const response = await axios.post(`${aiServiceUrl}/ai/predict-priority`, { text, title }, this.getAxiosConfig());
    const result = response.data.data;

    await this.prisma.aiPrediction.create({
      data: {
        ticketId,
        type: 'PRIORITY',
        parsedJson: result,
        confidence: result.confidence,
        modelName: 'gemini-1.5-flash',
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        aiPriorityConfidence: result.confidence,
      },
    });
  }

  private async processModeration(aiServiceUrl: string, ticketId: string, text: string) {
    const response = await axios.post(`${aiServiceUrl}/ai/moderate`, { text }, this.getAxiosConfig());
    const result = response.data.data;

    await this.prisma.aiPrediction.create({
      data: {
        ticketId,
        type: 'TOXICITY',
        parsedJson: result,
        confidence: result.confidence,
        modelName: 'gemini-1.5-flash',
      },
    });

    if (result.isToxic) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          isToxic: true,
          toxicitySeverity: result.severity,
          toxicityAction: result.recommendedAction,
        },
      });
    }
  }

  private async processSummary(aiServiceUrl: string, ticketId: string, text: string, title?: string) {
    const response = await axios.post(`${aiServiceUrl}/ai/summarize-ticket`, {
      ticketTitle: title,
      ticketDescription: text,
    }, this.getAxiosConfig());
    const result = response.data.data;

    await this.prisma.aiPrediction.create({
      data: {
        ticketId,
        type: 'SUMMARY',
        parsedJson: result,
        modelName: 'gemini-1.5-flash',
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        summary: result.shortSummary,
      },
    });
  }

  private async processEmbedding(aiServiceUrl: string, ticketId: string, text: string) {
    const response = await axios.post(`${aiServiceUrl}/ai/embeddings`, { text }, this.getAxiosConfig());
    const result = response.data.data;

    await this.prisma.embedding.upsert({
      where: { ticketId },
      create: {
        ticketId,
        vectorJson: result.embedding,
        modelName: result.model,
      },
      update: {
        vectorJson: result.embedding,
        modelName: result.model,
      },
    });
  }
}

