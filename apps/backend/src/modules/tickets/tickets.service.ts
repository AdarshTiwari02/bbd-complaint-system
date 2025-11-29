import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketRoutingService } from './ticket-routing.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { WinstonLoggerService } from '../../common/logger/winston-logger.service';
import { QUEUE_AI, QUEUE_NOTIFICATION } from '../../queue/queue.module';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CreateMessageDto,
  EscalateDto,
  RateTicketDto,
  TicketQueryDto,
} from './dto';

// Helper function to generate ticket numbers
function generateTicketNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `BBD-${dateStr}-${random}`;
}

// SLA hours by priority
const SLA_HOURS: Record<string, number> = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  CRITICAL: 6,
  URGENT: 4,
};

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routingService: TicketRoutingService,
    private readonly aiService: AiService,
    private readonly auditService: AuditService,
    private readonly logger: WinstonLoggerService,
    @Inject(QUEUE_AI) private readonly aiQueue: Queue,
    @Inject(QUEUE_NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  async create(dto: CreateTicketDto, userId: string, ipAddress?: string) {
    const ticketNumber = generateTicketNumber();

    // Get routing for this ticket
    const routing = await this.routingService.routeNewTicket(
      dto.category,
      dto.collegeId,
      dto.departmentId,
    );

    // Calculate SLA
    const priority = dto.priority || 'MEDIUM';
    const slaDueAt = new Date();
    slaDueAt.setHours(slaDueAt.getHours() + SLA_HOURS[priority]);

    // Generate anonymous identifier if needed
    let anonymousIdentifier: string | undefined;
    if (dto.isAnonymous) {
      const hash = userId.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      anonymousIdentifier = `Anonymous-${Math.abs(hash).toString(36).substring(0, 6).toUpperCase()}`;
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        title: dto.title,
        description: dto.description,
        createdByUserId: userId,
        isAnonymous: dto.isAnonymous || false,
        anonymousIdentifier,
        category: dto.category,
        type: dto.type,
        priority,
        status: 'OPEN',
        collegeId: dto.collegeId,
        departmentId: dto.departmentId,
        assignedToUserId: routing.assignedToUserId,
        currentLevel: routing.currentLevel,
        slaDueAt,
        tags: dto.tags || [],
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        college: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    // Queue AI jobs
    await this.aiQueue.add('summarize', {
      type: 'summarize',
      ticketId: ticket.id,
      text: dto.description,
      title: dto.title,
    });

    await this.aiQueue.add('moderate', {
      type: 'moderate',
      ticketId: ticket.id,
      text: `${dto.title}\n\n${dto.description}`,
    });

    await this.aiQueue.add('embed', {
      type: 'embed',
      ticketId: ticket.id,
      text: `${dto.title}\n\n${dto.description}`,
    });

    // Log audit
    await this.auditService.log({
      userId,
      action: 'CREATE',
      entityType: 'Ticket',
      entityId: ticket.id,
      ipAddress,
      metadata: { ticketNumber, category: dto.category },
    });

    // Queue notification to assigned user
    if (routing.assignedToUserId) {
      await this.notificationQueue.add('ticket-assigned', {
        type: 'in_app',
        userId: routing.assignedToUserId,
        subject: 'New ticket assigned',
        message: `A new ${dto.category.toLowerCase()} ticket has been assigned to you: ${dto.title}`,
        entityType: 'ticket',
        entityId: ticket.id,
      });
    }

    this.logger.log(
      `Ticket ${ticketNumber} created and routed to ${routing.currentLevel}`,
      'TicketsService',
    );

    return ticket;
  }

  async findAll(query: TicketQueryDto, userId: string, userRoles: string[]) {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      priority,
      type,
      collegeId,
      departmentId,
      assignedToUserId,
      createdByUserId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const where: Record<string, unknown> = {};

    // Role-based filtering
    if (userRoles.includes('STUDENT') || userRoles.includes('STAFF')) {
      // Students/staff can only see their own tickets
      where.createdByUserId = userId;
    } else if (userRoles.includes('HOD')) {
      // HOD sees tickets assigned to them or in their department
      where.OR = [
        { assignedToUserId: userId },
        { departmentId: query.departmentId },
      ];
    } else if (userRoles.includes('DIRECTOR')) {
      // Director sees all tickets in their college
      where.OR = [
        { assignedToUserId: userId },
        { collegeId: query.collegeId },
      ];
    } else if (
      userRoles.includes('TRANSPORT_INCHARGE') ||
      userRoles.includes('HOSTEL_WARDEN')
    ) {
      where.OR = [
        { assignedToUserId: userId },
        { category: userRoles.includes('TRANSPORT_INCHARGE') ? 'TRANSPORT' : 'HOSTEL' },
      ];
    }
    // CAMPUS_ADMIN, SYSTEM_ADMIN, MODERATOR can see all

    // Apply filters
    if (status) where.status = { in: status };
    if (category) where.category = { in: category };
    if (priority) where.priority = { in: priority };
    if (type) where.type = type;
    if (collegeId) where.collegeId = collegeId;
    if (departmentId) where.departmentId = departmentId;
    if (assignedToUserId) where.assignedToUserId = assignedToUserId;
    if (createdByUserId) where.createdByUserId = createdByUserId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          college: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          _count: {
            select: { messages: true, attachments: true },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    // Hide creator info for anonymous tickets (except for admins)
    const processedTickets = tickets.map((ticket) => {
      if (
        ticket.isAnonymous &&
        !userRoles.includes('CAMPUS_ADMIN') &&
        !userRoles.includes('SYSTEM_ADMIN')
      ) {
        return {
          ...ticket,
          createdBy: {
            id: 'anonymous',
            firstName: ticket.anonymousIdentifier || 'Anonymous',
            lastName: '',
            email: '',
          },
        };
      }
      return ticket;
    });

    return {
      data: processedTickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findById(id: string, userId: string, userRoles: string[]) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        college: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            attachments: true,
          },
        },
        attachments: true,
        escalations: {
          orderBy: { createdAt: 'asc' },
          include: {
            fromUser: {
              select: { id: true, firstName: true, lastName: true },
            },
            toUser: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        aiPredictions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check access
    const canAccess =
      ticket.createdByUserId === userId ||
      ticket.assignedToUserId === userId ||
      userRoles.includes('CAMPUS_ADMIN') ||
      userRoles.includes('SYSTEM_ADMIN') ||
      userRoles.includes('MODERATOR') ||
      (userRoles.includes('DIRECTOR') && ticket.collegeId) ||
      (userRoles.includes('HOD') && ticket.departmentId);

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    // Hide creator info for anonymous tickets
    if (
      ticket.isAnonymous &&
      !userRoles.includes('CAMPUS_ADMIN') &&
      !userRoles.includes('SYSTEM_ADMIN') &&
      ticket.createdByUserId !== userId
    ) {
      return {
        ...ticket,
        createdBy: {
          id: 'anonymous',
          firstName: ticket.anonymousIdentifier || 'Anonymous',
          lastName: '',
          email: '',
        },
      };
    }

    return ticket;
  }

  async findByTicketNumber(ticketNumber: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        college: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        escalations: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Return limited info for public tracking
    return {
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      category: ticket.category,
      type: ticket.type,
      priority: ticket.priority,
      status: ticket.status,
      currentLevel: ticket.currentLevel,
      slaDueAt: ticket.slaDueAt,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
      college: ticket.college,
      department: ticket.department,
      escalationCount: ticket.escalations.length,
    };
  }

  async update(id: string, dto: UpdateTicketDto, userId: string, ipAddress?: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (['CLOSED', 'REJECTED'].includes(ticket.status)) {
      throw new BadRequestException('Cannot update a closed ticket');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.title) updateData.title = dto.title;
    if (dto.description) updateData.description = dto.description;
    if (dto.priority) {
      updateData.priority = dto.priority;
      // Recalculate SLA
      const slaDueAt = new Date(ticket.createdAt);
      slaDueAt.setHours(slaDueAt.getHours() + SLA_HOURS[dto.priority]);
      updateData.slaDueAt = slaDueAt;
    }
    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
      }
      if (dto.status === 'CLOSED') {
        updateData.closedAt = new Date();
      }
    }
    if (dto.assignedToUserId) {
      updateData.assignedToUserId = dto.assignedToUserId;
    }
    if (dto.tags) updateData.tags = dto.tags;

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'Ticket',
      entityId: id,
      ipAddress,
      metadata: { changes: dto },
    });

    return updated;
  }

  async addMessage(
    ticketId: string,
    dto: CreateMessageDto,
    userId: string,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (['CLOSED', 'REJECTED'].includes(ticket.status)) {
      throw new BadRequestException('Cannot add message to a closed ticket');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderUserId: userId,
        message: dto.message,
        isInternal: dto.isInternal || false,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Update ticket status if needed
    if (ticket.status === 'OPEN' && userId !== ticket.createdByUserId) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'IN_PROGRESS',
          firstResponseAt: ticket.firstResponseAt || new Date(),
        },
      });
    }

    // Notify ticket creator or assignee
    const notifyUserId =
      userId === ticket.createdByUserId
        ? ticket.assignedToUserId
        : ticket.createdByUserId;

    if (notifyUserId && !dto.isInternal) {
      await this.notificationQueue.add('ticket-message', {
        type: 'in_app',
        userId: notifyUserId,
        subject: 'New message on your ticket',
        message: `New message on ticket ${ticket.ticketNumber}`,
        entityType: 'ticket',
        entityId: ticketId,
      });
    }

    return message;
  }

  async escalate(
    ticketId: string,
    dto: EscalateDto,
    userId: string,
    ipAddress?: string,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!ticket.currentLevel) {
      throw new BadRequestException('Ticket has no current routing level');
    }

    const result = await this.routingService.escalateTicket(
      ticketId,
      ticket.currentLevel,
      dto.reason,
      userId,
    );

    await this.auditService.log({
      userId,
      action: 'ESCALATE',
      entityType: 'Ticket',
      entityId: ticketId,
      ipAddress,
      metadata: { fromLevel: ticket.currentLevel, toLevel: result.currentLevel },
    });

    return this.findById(ticketId, userId, ['CAMPUS_ADMIN']);
  }

  async rate(
    ticketId: string,
    dto: RateTicketDto,
    userId: string,
    ipAddress?: string,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.createdByUserId !== userId) {
      throw new ForbiddenException('Only the ticket creator can rate');
    }

    if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      throw new BadRequestException('Can only rate resolved or closed tickets');
    }

    if (ticket.rating) {
      throw new BadRequestException('Ticket has already been rated');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        rating: dto.rating,
        ratingComment: dto.comment,
        ratedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId,
      action: 'RATE',
      entityType: 'Ticket',
      entityId: ticketId,
      ipAddress,
      metadata: { rating: dto.rating },
    });

    return updated;
  }

  async getTimeline(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          where: { isSystem: true },
          orderBy: { createdAt: 'asc' },
        },
        escalations: {
          orderBy: { createdAt: 'asc' },
          include: {
            fromUser: {
              select: { id: true, firstName: true, lastName: true },
            },
            toUser: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const timeline = [];

    // Add creation event
    timeline.push({
      type: 'created',
      timestamp: ticket.createdAt,
      data: {
        status: 'OPEN',
        category: ticket.category,
        priority: ticket.priority,
      },
    });

    // Add escalations
    for (const esc of ticket.escalations) {
      timeline.push({
        type: 'escalation',
        timestamp: esc.createdAt,
        data: {
          fromRole: esc.fromRole,
          toRole: esc.toRole,
          reason: esc.reason,
          autoEscalated: esc.autoEscalated,
          fromUser: esc.fromUser,
          toUser: esc.toUser,
        },
      });
    }

    // Add system messages (status changes, assignments)
    for (const msg of ticket.messages) {
      timeline.push({
        type: 'system_message',
        timestamp: msg.createdAt,
        data: { message: msg.message },
      });
    }

    // Add resolution
    if (ticket.resolvedAt) {
      timeline.push({
        type: 'resolved',
        timestamp: ticket.resolvedAt,
        data: { status: 'RESOLVED' },
      });
    }

    // Add rating
    if (ticket.ratedAt) {
      timeline.push({
        type: 'rated',
        timestamp: ticket.ratedAt,
        data: { rating: ticket.rating, comment: ticket.ratingComment },
      });
    }

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return timeline;
  }

  async getSimilarTickets(ticketId: string) {
    return this.aiService.findSimilarTickets(ticketId);
  }

  async generateReplyDraft(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10,
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Get user role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    const responderRole = user?.roles[0]?.role.displayName || 'Staff';

    const conversationHistory = ticket.messages.map((msg) => ({
      role: msg.senderUserId === ticket.createdByUserId ? 'user' as const : 'staff' as const,
      message: msg.message,
      timestamp: msg.createdAt,
    }));

    return this.aiService.generateReplyDraft({
      ticketTitle: ticket.title,
      ticketDescription: ticket.description,
      conversationHistory,
      ticketCategory: ticket.category,
      responderRole,
    });
  }
}

