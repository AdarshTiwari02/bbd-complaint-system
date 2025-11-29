import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { WinstonLoggerService } from '../../common/logger/winston-logger.service';
import { QUEUE_NOTIFICATION } from '../queue.module';

export type NotificationType = 'email' | 'sms' | 'push' | 'in_app';

export interface NotificationJobData {
  type: NotificationType;
  userId?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
}

@Injectable()
export class NotificationProcessor implements OnModuleInit {
  private worker: Worker;

  constructor(
    @Inject('BULLMQ_CONNECTION') private readonly connection: Redis,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async onModuleInit() {
    this.worker = new Worker<NotificationJobData>(
      QUEUE_NOTIFICATION,
      async (job: Job<NotificationJobData>) => {
        await this.processNotification(job);
      },
      {
        connection: this.connection,
        concurrency: 10,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Notification job ${job.id} completed`, 'NotificationProcessor');
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Notification job ${job?.id} failed: ${err.message}`,
        err.stack,
        'NotificationProcessor',
      );
    });
  }

  private async processNotification(job: Job<NotificationJobData>) {
    const { type, userId, message, subject, entityType, entityId } = job.data;

    try {
      switch (type) {
        case 'email':
          await this.sendEmail(job.data);
          break;
        case 'sms':
          await this.sendSms(job.data);
          break;
        case 'in_app':
          await this.createInAppNotification(job.data);
          break;
        case 'push':
          await this.sendPushNotification(job.data);
          break;
      }

      this.logger.log(
        `${type} notification sent to ${userId || job.data.email}`,
        'NotificationProcessor',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send ${type} notification: ${(error as Error).message}`,
        (error as Error).stack,
        'NotificationProcessor',
      );
      throw error;
    }
  }

  private async sendEmail(data: NotificationJobData) {
    // In production, integrate with SendGrid, AWS SES, etc.
    // For now, just log the email
    this.logger.log(
      `[EMAIL] To: ${data.email}, Subject: ${data.subject}, Message: ${data.message}`,
      'NotificationProcessor',
    );
    
    // Example SendGrid integration:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    // await sgMail.send({
    //   to: data.email,
    //   from: this.configService.get('EMAIL_FROM'),
    //   subject: data.subject,
    //   html: data.message,
    // });
  }

  private async sendSms(data: NotificationJobData) {
    // In production, integrate with Twilio, AWS SNS, etc.
    this.logger.log(
      `[SMS] To: ${data.phone}, Message: ${data.message}`,
      'NotificationProcessor',
    );
  }

  private async createInAppNotification(data: NotificationJobData) {
    if (!data.userId) return;

    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.subject || 'Notification',
        message: data.message,
        type: data.entityType || 'general',
        entityType: data.entityType,
        entityId: data.entityId,
      },
    });
  }

  private async sendPushNotification(data: NotificationJobData) {
    // In production, integrate with Firebase Cloud Messaging, OneSignal, etc.
    this.logger.log(
      `[PUSH] To: ${data.userId}, Title: ${data.subject}, Message: ${data.message}`,
      'NotificationProcessor',
    );
  }
}

