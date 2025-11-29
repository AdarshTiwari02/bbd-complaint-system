import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async getFlaggedTickets(query: { page?: number; limit?: number; severity?: string }) {
    const { page = 1, limit = 20, severity } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isToxic: true,
    };

    if (severity) {
      where.toxicitySeverity = severity;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          description: true,
          category: true,
          status: true,
          isToxic: true,
          toxicitySeverity: true,
          toxicityAction: true,
          createdAt: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          aiPredictions: {
            where: { type: 'TOXICITY' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getModerationQueue() {
    // Get tickets with BLOCK action that need review
    const tickets = await this.prisma.ticket.findMany({
      where: {
        isToxic: true,
        toxicityAction: 'BLOCK',
        status: 'OPEN',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        description: true,
        toxicitySeverity: true,
        createdAt: true,
        aiPredictions: {
          where: { type: 'TOXICITY' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return tickets;
  }

  async approveTicket(ticketId: string, moderatorId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Clear toxicity flags and allow the ticket
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        isToxic: false,
        toxicitySeverity: null,
        toxicityAction: 'ALLOW',
      },
    });

    // Create system message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        message: 'Ticket reviewed and approved by moderator',
        isSystem: true,
        isInternal: true,
      },
    });

    return { message: 'Ticket approved' };
  }

  async rejectTicket(ticketId: string, moderatorId: string, reason: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'REJECTED',
        closedAt: new Date(),
      },
    });

    // Create system message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        message: `Ticket rejected by moderator. Reason: ${reason}`,
        isSystem: true,
        isInternal: true,
      },
    });

    return { message: 'Ticket rejected' };
  }

  async remoderateTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Re-run moderation through AI
    const result = await this.aiService.moderateContent(
      `${ticket.title}\n\n${ticket.description}`,
    );

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        isToxic: result.isToxic,
        toxicitySeverity: result.severity as any,
        toxicityAction: result.recommendedAction as any,
      },
    });

    await this.prisma.aiPrediction.create({
      data: {
        ticketId,
        type: 'TOXICITY',
        parsedJson: result as any,
        confidence: result.confidence,
        modelName: 'gemini-1.5-flash',
      },
    });

    return result;
  }

  async getModerationStats() {
    const [
      totalFlagged,
      pendingReview,
      approvedToday,
      rejectedToday,
      bySeverity,
    ] = await Promise.all([
      this.prisma.ticket.count({ where: { isToxic: true } }),
      this.prisma.ticket.count({
        where: {
          isToxic: true,
          toxicityAction: 'BLOCK',
          status: 'OPEN',
        },
      }),
      this.prisma.ticket.count({
        where: {
          isToxic: false,
          toxicityAction: 'ALLOW',
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.ticket.count({
        where: {
          status: 'REJECTED',
          closedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.ticket.groupBy({
        by: ['toxicitySeverity'],
        where: { isToxic: true },
        _count: true,
      }),
    ]);

    return {
      totalFlagged,
      pendingReview,
      approvedToday,
      rejectedToday,
      bySeverity: Object.fromEntries(
        bySeverity.map((s) => [s.toxicitySeverity, s._count]),
      ),
    };
  }
}

