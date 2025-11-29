import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { OcrProcessor } from './processors/ocr.processor';
import { AiProcessor } from './processors/ai.processor';
import { NotificationProcessor } from './processors/notification.processor';

export const QUEUE_OCR = 'ocr-queue';
export const QUEUE_AI = 'ai-queue';
export const QUEUE_NOTIFICATION = 'notification-queue';

@Global()
@Module({
  providers: [
    {
      provide: 'BULLMQ_CONNECTION',
      useFactory: (configService: ConfigService) => {
        return new Redis(configService.get('REDIS_URL', 'redis://localhost:6379'), {
          maxRetriesPerRequest: null,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: QUEUE_OCR,
      useFactory: (connection: Redis) => {
        return new Queue(QUEUE_OCR, { connection });
      },
      inject: ['BULLMQ_CONNECTION'],
    },
    {
      provide: QUEUE_AI,
      useFactory: (connection: Redis) => {
        return new Queue(QUEUE_AI, { connection });
      },
      inject: ['BULLMQ_CONNECTION'],
    },
    {
      provide: QUEUE_NOTIFICATION,
      useFactory: (connection: Redis) => {
        return new Queue(QUEUE_NOTIFICATION, { connection });
      },
      inject: ['BULLMQ_CONNECTION'],
    },
    OcrProcessor,
    AiProcessor,
    NotificationProcessor,
  ],
  exports: [QUEUE_OCR, QUEUE_AI, QUEUE_NOTIFICATION],
})
export class QueueModule {}

