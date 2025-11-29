import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketCategory, RoutingLevel } from '@prisma/client';
import { WinstonLoggerService } from '../../common/logger/winston-logger.service';

interface RoutingResult {
  assignedToUserId: string | null;
  currentLevel: RoutingLevel;
  escalationCreated?: boolean;
}

// Category to initial routing level mapping
// Transport, Hostel, and Campus complaints skip HOD and go directly to respective incharges
const CATEGORY_ROUTING: Record<TicketCategory, RoutingLevel> = {
  TRANSPORT: 'TRANSPORT_INCHARGE',  // Direct to Transport Incharge (skip HOD)
  HOSTEL: 'HOSTEL_WARDEN',          // Direct to Hostel Warden (skip HOD)
  ACADEMIC: 'HOD',                   // Goes through HOD
  ADMINISTRATIVE: 'HOD',             // Goes through HOD
  OTHER: 'HOD',                      // Goes through HOD
};

// Routing level hierarchy for escalation
const ROUTING_HIERARCHY: Record<RoutingLevel, RoutingLevel | null> = {
  CLASS_COORDINATOR: 'HOD',
  HOD: 'DIRECTOR',
  DEAN: 'CAMPUS_ADMIN',
  DIRECTOR: 'CAMPUS_ADMIN',
  DIRECTOR_FINANCE: 'SYSTEM_ADMIN',
  TRANSPORT_INCHARGE: 'SYSTEM_ADMIN',  // Transport escalates to System Admin
  HOSTEL_WARDEN: 'SYSTEM_ADMIN',       // Hostel escalates to System Admin
  CAMPUS_ADMIN: 'SYSTEM_ADMIN',
  SYSTEM_ADMIN: null, // Top level - cannot escalate further
};

@Injectable()
export class TicketRoutingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {}

  /**
   * Determine initial routing for a new ticket
   */
  async routeNewTicket(
    category: TicketCategory,
    collegeId?: string,
    departmentId?: string,
  ): Promise<RoutingResult> {
    const initialLevel = CATEGORY_ROUTING[category];

    switch (category) {
      case 'TRANSPORT':
        return this.findTransportIncharge();

      case 'HOSTEL':
        return this.findHostelWarden();

      case 'ACADEMIC':
      case 'ADMINISTRATIVE':
      case 'OTHER':
        if (departmentId) {
          return this.findDepartmentHod(departmentId);
        }
        if (collegeId) {
          return this.findCollegeDirector(collegeId);
        }
        // Fallback to campus admin
        return this.findCampusAdmin();

      default:
        return this.findCampusAdmin();
    }
  }

  /**
   * Escalate a ticket to the next level
   */
  async escalateTicket(
    ticketId: string,
    currentLevel: RoutingLevel,
    reason: string,
    fromUserId?: string,
    autoEscalated: boolean = false,
  ): Promise<RoutingResult> {
    const nextLevel = ROUTING_HIERARCHY[currentLevel];

    if (!nextLevel) {
      throw new BadRequestException('Ticket is already at the highest level');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        department: true,
        college: true,
      },
    });

    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    let result: RoutingResult;

    switch (nextLevel) {
      case 'HOD':
        if (ticket.departmentId) {
          result = await this.findDepartmentHod(ticket.departmentId);
        } else {
          result = await this.findCollegeDirector(ticket.collegeId!);
        }
        break;

      case 'DIRECTOR':
        if (ticket.collegeId) {
          result = await this.findCollegeDirector(ticket.collegeId);
        } else {
          result = await this.findCampusAdmin();
        }
        break;

      case 'CAMPUS_ADMIN':
        result = await this.findCampusAdmin();
        break;

      case 'SYSTEM_ADMIN':
        result = await this.findSystemAdmin();
        break;

      default:
        result = await this.findCampusAdmin();
    }

    // Create escalation record
    await this.prisma.escalation.create({
      data: {
        ticketId,
        fromRole: currentLevel,
        toRole: nextLevel,
        fromUserId,
        toUserId: result.assignedToUserId,
        reason,
        autoEscalated,
      },
    });

    // Update ticket status
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'ESCALATED',
        currentLevel: nextLevel,
        assignedToUserId: result.assignedToUserId,
      },
    });

    // Create system message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        message: `Ticket escalated from ${currentLevel} to ${nextLevel}. Reason: ${reason}`,
        isSystem: true,
        isInternal: true,
      },
    });

    this.logger.log(
      `Ticket ${ticketId} escalated from ${currentLevel} to ${nextLevel}`,
      'TicketRoutingService',
    );

    return {
      ...result,
      escalationCreated: true,
    };
  }

  /**
   * Reassign ticket to another user within same level
   */
  async reassignTicket(
    ticketId: string,
    newAssigneeId: string,
    reason?: string,
  ): Promise<void> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToUserId: newAssigneeId,
      },
    });

    // Create system message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        message: `Ticket reassigned${reason ? `. Reason: ${reason}` : ''}`,
        isSystem: true,
        isInternal: true,
      },
    });
  }

  /**
   * Check for SLA breaches and auto-escalate if needed
   */
  async checkAndAutoEscalate(): Promise<number> {
    const breachedTickets = await this.prisma.ticket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING_INFO'] },
        slaDueAt: { lt: new Date() },
        currentLevel: { not: 'CAMPUS_ADMIN' },
      },
    });

    let escalatedCount = 0;

    for (const ticket of breachedTickets) {
      if (ticket.currentLevel) {
        try {
          await this.escalateTicket(
            ticket.id,
            ticket.currentLevel,
            'Auto-escalated due to SLA breach',
            undefined,
            true,
          );
          escalatedCount++;
        } catch (error) {
          this.logger.error(
            `Failed to auto-escalate ticket ${ticket.id}: ${(error as Error).message}`,
            (error as Error).stack,
            'TicketRoutingService',
          );
        }
      }
    }

    return escalatedCount;
  }

  // ===========================================
  // PRIVATE HELPER METHODS
  // ===========================================

  private async findTransportIncharge(): Promise<RoutingResult> {
    const user = await this.prisma.user.findFirst({
      where: {
        roles: { some: { role: { name: 'TRANSPORT_INCHARGE' } } },
        status: 'ACTIVE',
      },
    });

    return {
      assignedToUserId: user?.id || null,
      currentLevel: 'TRANSPORT_INCHARGE',
    };
  }

  private async findHostelWarden(): Promise<RoutingResult> {
    const user = await this.prisma.user.findFirst({
      where: {
        roles: { some: { role: { name: 'HOSTEL_WARDEN' } } },
        status: 'ACTIVE',
      },
    });

    return {
      assignedToUserId: user?.id || null,
      currentLevel: 'HOSTEL_WARDEN',
    };
  }

  private async findDepartmentHod(departmentId: string): Promise<RoutingResult> {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: { hod: true },
    });

    if (department?.hod) {
      return {
        assignedToUserId: department.hod.id,
        currentLevel: 'HOD',
      };
    }

    // Fallback: find any HOD in the department
    const hodUser = await this.prisma.user.findFirst({
      where: {
        departmentId,
        roles: { some: { role: { name: 'HOD' } } },
        status: 'ACTIVE',
      },
    });

    return {
      assignedToUserId: hodUser?.id || null,
      currentLevel: 'HOD',
    };
  }

  private async findCollegeDirector(collegeId: string): Promise<RoutingResult> {
    const college = await this.prisma.college.findUnique({
      where: { id: collegeId },
      include: { director: true },
    });

    if (college?.director) {
      return {
        assignedToUserId: college.director.id,
        currentLevel: 'DIRECTOR',
      };
    }

    // Fallback: find any director for the college
    const director = await this.prisma.user.findFirst({
      where: {
        collegeId,
        roles: { some: { role: { name: 'DIRECTOR' } } },
        status: 'ACTIVE',
      },
    });

    return {
      assignedToUserId: director?.id || null,
      currentLevel: 'DIRECTOR',
    };
  }

  private async findCampusAdmin(): Promise<RoutingResult> {
    const admin = await this.prisma.user.findFirst({
      where: {
        roles: { some: { role: { name: 'CAMPUS_ADMIN' } } },
        status: 'ACTIVE',
      },
    });

    return {
      assignedToUserId: admin?.id || null,
      currentLevel: 'CAMPUS_ADMIN',
    };
  }

  private async findSystemAdmin(): Promise<RoutingResult> {
    const admin = await this.prisma.user.findFirst({
      where: {
        roles: { some: { role: { name: 'SYSTEM_ADMIN' } } },
        status: 'ACTIVE',
      },
    });

    return {
      assignedToUserId: admin?.id || null,
      currentLevel: 'SYSTEM_ADMIN',
    };
  }
}

