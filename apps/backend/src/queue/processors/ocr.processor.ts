import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { WinstonLoggerService } from '../../common/logger/winston-logger.service';
import { QUEUE_OCR } from '../queue.module';

export interface OcrJobData {
  attachmentId: string;
  s3Key: string;
  fileUrl: string;
  mimeType: string;
}

@Injectable()
export class OcrProcessor implements OnModuleInit {
  private worker: Worker;

  constructor(
    @Inject('BULLMQ_CONNECTION') private readonly connection: Redis,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async onModuleInit() {
    this.worker = new Worker<OcrJobData>(
      QUEUE_OCR,
      async (job: Job<OcrJobData>) => {
        await this.processOcr(job);
      },
      {
        connection: this.connection,
        concurrency: 3,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`OCR job ${job.id} completed`, 'OcrProcessor');
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`OCR job ${job?.id} failed: ${err.message}`, err.stack, 'OcrProcessor');
    });
  }

  private async processOcr(job: Job<OcrJobData>) {
    const { attachmentId, fileUrl, mimeType } = job.data;

    try {
      const aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:3002');
      
      const response = await axios.post(`${aiServiceUrl}/ai/ocr`, {
        fileUrl,
        mimeType,
      });

      const { text } = response.data.data;

      await this.prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          ocrText: text,
          ocrProcessed: true,
        },
      });

      this.logger.log(`OCR completed for attachment ${attachmentId}`, 'OcrProcessor');
    } catch (error) {
      this.logger.error(
        `OCR failed for attachment ${attachmentId}: ${(error as Error).message}`,
        (error as Error).stack,
        'OcrProcessor',
      );
      throw error;
    }
  }
}

