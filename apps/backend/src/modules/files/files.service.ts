import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from './s3.service';
import { WinstonLoggerService } from '../../common/logger/winston-logger.service';
import { QUEUE_OCR } from '../../queue/queue.module';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly logger: WinstonLoggerService,
    @Inject(QUEUE_OCR) private readonly ocrQueue: Queue,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    ticketId?: string,
    messageId?: string,
  ) {
    // Validate file
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Upload to S3
    const { key, url } = await this.s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Create attachment record
    const attachment = await this.prisma.attachment.create({
      data: {
        ticketId,
        messageId,
        fileName: key.split('/').pop() || file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        s3Key: key,
        url,
      },
    });

    // Queue OCR for images and PDFs
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      await this.ocrQueue.add('ocr', {
        attachmentId: attachment.id,
        s3Key: key,
        fileUrl: url,
        mimeType: file.mimetype,
      });
    }

    this.logger.log(
      `File uploaded: ${file.originalname} -> ${key}`,
      'FilesService',
    );

    return attachment;
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    ticketId?: string,
    messageId?: string,
  ) {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, ticketId, messageId),
    );
    return Promise.all(uploadPromises);
  }

  async getAttachment(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Refresh signed URL if needed
    const url = await this.s3Service.getSignedUrl(attachment.s3Key);

    return {
      ...attachment,
      url,
    };
  }

  async getTicketAttachments(ticketId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
    });

    // Refresh signed URLs
    return Promise.all(
      attachments.map(async (attachment) => ({
        ...attachment,
        url: await this.s3Service.getSignedUrl(attachment.s3Key),
      })),
    );
  }

  async deleteAttachment(id: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: {
        ticket: { select: { createdByUserId: true } },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Only ticket creator or admin can delete
    if (attachment.ticket?.createdByUserId !== userId) {
      throw new BadRequestException('You cannot delete this attachment');
    }

    // Delete from S3
    await this.s3Service.deleteFile(attachment.s3Key);

    // Delete from database
    await this.prisma.attachment.delete({ where: { id } });

    return { message: 'Attachment deleted' };
  }

  async linkAttachmentToTicket(attachmentId: string, ticketId: string) {
    return this.prisma.attachment.update({
      where: { id: attachmentId },
      data: { ticketId },
    });
  }

  async linkAttachmentToMessage(attachmentId: string, messageId: string) {
    return this.prisma.attachment.update({
      where: { id: attachmentId },
      data: { messageId },
    });
  }
}

