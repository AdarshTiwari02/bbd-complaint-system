import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { TicketCategory } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async getOverview(filters?: { campusId?: string; collegeId?: string; departmentId?: string; dateFrom?: Date; dateTo?: Date }) {
    const where: Record<string, unknown> = {};

    if (filters?.collegeId) where.collegeId = filters.collegeId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) (where.createdAt as Record<string, Date>).gte = filters.dateFrom;
      if (filters?.dateTo) (where.createdAt as Record<string, Date>).lte = filters.dateTo;
    }

    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      avgResolutionTime,
      slaBreaches,
      avgRating,
      ticketsByCategory,
      ticketsByPriority,
      ticketsByStatus,
    ] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING_INFO'] } } }),
      this.prisma.ticket.count({ where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } } }),
      this.prisma.ticket.aggregate({
        where: { ...where, resolvedAt: { not: null } },
        _avg: { rating: true },
      }),
      this.prisma.ticket.count({
        where: {
          ...where,
          slaDueAt: { lt: new Date() },
          status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] },
        },
      }),
      this.prisma.ticket.aggregate({
        where: { ...where, rating: { not: null } },
        _avg: { rating: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ]);

    // Calculate average resolution time
    const resolvedTicketsWithTime = await this.prisma.ticket.findMany({
      where: { ...where, resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionHours = 0;
    if (resolvedTicketsWithTime.length > 0) {
      const totalHours = resolvedTicketsWithTime.reduce((sum, t) => {
        const diff = (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        return sum + diff;
      }, 0);
      avgResolutionHours = totalHours / resolvedTicketsWithTime.length;
    }

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      averageResolutionTimeHours: Math.round(avgResolutionHours * 10) / 10,
      slaBreachRate: totalTickets > 0 ? Math.round((slaBreaches / totalTickets) * 100) : 0,
      averageRating: avgRating._avg.rating || 0,
      ticketsByCategory: Object.fromEntries(
        ticketsByCategory.map((t) => [t.category, t._count]),
      ),
      ticketsByPriority: Object.fromEntries(
        ticketsByPriority.map((t) => [t.priority, t._count]),
      ),
      ticketsByStatus: Object.fromEntries(
        ticketsByStatus.map((t) => [t.status, t._count]),
      ),
    };
  }

  async getByCollege(filters?: { dateFrom?: Date; dateTo?: Date }) {
    const where: Record<string, unknown> = {};
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) (where.createdAt as Record<string, Date>).gte = filters.dateFrom;
      if (filters?.dateTo) (where.createdAt as Record<string, Date>).lte = filters.dateTo;
    }

    const colleges = await this.prisma.college.findMany({
      where: { isActive: true },
      include: {
        tickets: {
          where,
          select: {
            id: true,
            status: true,
            rating: true,
            resolvedAt: true,
            createdAt: true,
            slaDueAt: true,
          },
        },
      },
    });

    return colleges.map((college) => {
      const tickets = college.tickets;
      const resolved = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status));
      const slaBreaches = tickets.filter(
        (t) => t.slaDueAt && t.slaDueAt < new Date() && !['RESOLVED', 'CLOSED', 'REJECTED'].includes(t.status),
      );
      const ratings = tickets.filter((t) => t.rating).map((t) => t.rating!);

      return {
        collegeId: college.id,
        collegeName: college.name,
        collegeCode: college.code,
        totalTickets: tickets.length,
        resolvedTickets: resolved.length,
        openTickets: tickets.length - resolved.length,
        slaBreaches: slaBreaches.length,
        averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
      };
    });
  }

  async getByDepartment(collegeId?: string, filters?: { dateFrom?: Date; dateTo?: Date }) {
    const where: Record<string, unknown> = {};
    if (collegeId) where.collegeId = collegeId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) (where.createdAt as Record<string, Date>).gte = filters.dateFrom;
      if (filters?.dateTo) (where.createdAt as Record<string, Date>).lte = filters.dateTo;
    }

    const departments = await this.prisma.department.findMany({
      where: { isActive: true, ...(collegeId ? { collegeId } : {}) },
      include: {
        college: { select: { id: true, name: true } },
        tickets: {
          where,
          select: {
            id: true,
            status: true,
            rating: true,
          },
        },
      },
    });

    return departments.map((dept) => ({
      departmentId: dept.id,
      departmentName: dept.name,
      departmentCode: dept.code,
      college: dept.college,
      totalTickets: dept.tickets.length,
      resolvedTickets: dept.tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length,
    }));
  }

  async getSlaAnalytics(filters?: { collegeId?: string; departmentId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.collegeId) where.collegeId = filters.collegeId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    const tickets = await this.prisma.ticket.findMany({
      where,
      select: {
        id: true,
        priority: true,
        status: true,
        slaDueAt: true,
        createdAt: true,
        resolvedAt: true,
      },
    });

    const byPriority: Record<string, { total: number; breached: number; avgTime: number }> = {};

    for (const ticket of tickets) {
      const priority = ticket.priority;
      if (!byPriority[priority]) {
        byPriority[priority] = { total: 0, breached: 0, avgTime: 0 };
      }

      byPriority[priority].total++;

      if (
        ticket.slaDueAt &&
        ticket.slaDueAt < new Date() &&
        !['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status)
      ) {
        byPriority[priority].breached++;
      }
    }

    return {
      overall: {
        total: tickets.length,
        breached: tickets.filter(
          (t) => t.slaDueAt && t.slaDueAt < new Date() && !['RESOLVED', 'CLOSED', 'REJECTED'].includes(t.status),
        ).length,
        breachRate: tickets.length > 0
          ? Math.round(
              (tickets.filter(
                (t) => t.slaDueAt && t.slaDueAt < new Date() && !['RESOLVED', 'CLOSED', 'REJECTED'].includes(t.status),
              ).length / tickets.length) * 100,
            )
          : 0,
      },
      byPriority,
    };
  }

  async getSatisfactionAnalytics(filters?: { collegeId?: string; departmentId?: string }) {
    const where: Record<string, unknown> = { rating: { not: null } };
    if (filters?.collegeId) where.collegeId = filters.collegeId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    const [avgRating, ratingDistribution, ratingsByCategory] = await Promise.all([
      this.prisma.ticket.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['rating'],
        where,
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['category'],
        where,
        _avg: { rating: true },
      }),
    ]);

    return {
      averageRating: avgRating._avg.rating || 0,
      totalRatings: avgRating._count.rating,
      ratingDistribution: Object.fromEntries(
        ratingDistribution.map((r) => [r.rating?.toString() || '0', r._count]),
      ),
      ratingsByCategory: Object.fromEntries(
        ratingsByCategory.map((r) => [r.category, r._avg.rating || 0]),
      ),
    };
  }

  async getHeatmap(filters?: { collegeId?: string; departmentId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.collegeId) where.collegeId = filters.collegeId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    const tickets = await this.prisma.ticket.findMany({
      where,
      select: { createdAt: true },
    });

    const heatmap: Array<{ dayOfWeek: number; hourOfDay: number; count: number }> = [];

    // Initialize all slots
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmap.push({ dayOfWeek: day, hourOfDay: hour, count: 0 });
      }
    }

    // Count tickets
    for (const ticket of tickets) {
      const date = new Date(ticket.createdAt);
      const dayOfWeek = date.getDay();
      const hourOfDay = date.getHours();
      const index = dayOfWeek * 24 + hourOfDay;
      heatmap[index].count++;
    }

    return heatmap;
  }

  async getAiInsights(filters?: { collegeId?: string; departmentId?: string; days?: number }) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - (filters?.days || 30));

    const where: Record<string, unknown> = {
      createdAt: { gte: dateFrom },
    };
    if (filters?.collegeId) where.collegeId = filters.collegeId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    const tickets = await this.prisma.ticket.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        createdAt: true,
      },
    });

    if (tickets.length < 5) {
      return {
        message: 'Not enough tickets for trend analysis',
        clusters: [],
        topIssues: [],
        recommendations: [],
      };
    }

    try {
      return await this.aiService.analyzeTrends(
        tickets.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category as TicketCategory,
          tags: t.tags,
          createdAt: t.createdAt,
        })),
      );
    } catch {
      return {
        message: 'AI analysis unavailable',
        clusters: [],
        topIssues: [],
        recommendations: [],
      };
    }
  }

  async getTrendsByPeriod(period: 'day' | 'week' | 'month', filters?: { collegeId?: string; departmentId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.collegeId) where.collegeId = filters.collegeId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    // Get date range based on period
    const endDate = new Date();
    const startDate = new Date();
    let groupFormat: string;

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 30);
        groupFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 12 * 7);
        groupFormat = 'YYYY-WW';
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 12);
        groupFormat = 'YYYY-MM';
        break;
    }

    where.createdAt = { gte: startDate, lte: endDate };

    const tickets = await this.prisma.ticket.findMany({
      where,
      select: {
        createdAt: true,
        resolvedAt: true,
        status: true,
        slaDueAt: true,
      },
    });

    // Group by period
    const grouped: Record<string, {
      ticketsCreated: number;
      ticketsResolved: number;
      slaBreaches: number;
    }> = {};

    for (const ticket of tickets) {
      let periodKey: string;
      const date = new Date(ticket.createdAt);

      switch (period) {
        case 'day':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekNum = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
          periodKey = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = { ticketsCreated: 0, ticketsResolved: 0, slaBreaches: 0 };
      }

      grouped[periodKey].ticketsCreated++;

      if (ticket.resolvedAt) {
        grouped[periodKey].ticketsResolved++;
      }

      if (
        ticket.slaDueAt &&
        ticket.slaDueAt < new Date() &&
        !['RESOLVED', 'CLOSED', 'REJECTED'].includes(ticket.status)
      ) {
        grouped[periodKey].slaBreaches++;
      }
    }

    return Object.entries(grouped)
      .map(([period, data]) => ({
        period,
        ...data,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }
}

