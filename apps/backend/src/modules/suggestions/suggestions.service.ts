import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketType } from '@prisma/client';

@Injectable()
export class SuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSuggestions(query: {
    page?: number;
    limit?: number;
    collegeId?: string;
    departmentId?: string;
    sortBy?: 'upvotes' | 'createdAt';
  }) {
    const { page = 1, limit = 20, collegeId, departmentId, sortBy = 'upvotes' } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isPublic: true,
      isApprovedByModerator: true,
    };

    if (collegeId) {
      where.ticket = { collegeId };
    }
    if (departmentId) {
      where.ticket = { ...((where.ticket as object) || {}), departmentId };
    }

    const [suggestions, total] = await Promise.all([
      this.prisma.suggestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy === 'upvotes' ? { upvotes: 'desc' } : { createdAt: 'desc' },
        include: {
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
              description: true,
              category: true,
              createdAt: true,
              college: { select: { id: true, name: true, code: true } },
              department: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
      this.prisma.suggestion.count({ where }),
    ]);

    return {
      data: suggestions,
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

  async getSuggestionById(id: string) {
    const suggestion = await this.prisma.suggestion.findUnique({
      where: { id },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            description: true,
            category: true,
            status: true,
            createdAt: true,
            college: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return suggestion;
  }

  async vote(suggestionId: string, userId: string, isUpvote: boolean) {
    const suggestion = await this.prisma.suggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    if (!suggestion.isPublic || !suggestion.isApprovedByModerator) {
      throw new BadRequestException('Cannot vote on this suggestion');
    }

    // Check for existing vote
    const existingVote = await this.prisma.suggestionVote.findUnique({
      where: {
        suggestionId_userId: { suggestionId, userId },
      },
    });

    if (existingVote) {
      if (existingVote.isUpvote === isUpvote) {
        // Remove vote
        await this.prisma.suggestionVote.delete({
          where: { id: existingVote.id },
        });

        await this.prisma.suggestion.update({
          where: { id: suggestionId },
          data: {
            upvotes: isUpvote ? { decrement: 1 } : undefined,
            downvotes: !isUpvote ? { decrement: 1 } : undefined,
          },
        });

        return { action: 'removed', isUpvote };
      } else {
        // Change vote
        await this.prisma.suggestionVote.update({
          where: { id: existingVote.id },
          data: { isUpvote },
        });

        await this.prisma.suggestion.update({
          where: { id: suggestionId },
          data: {
            upvotes: isUpvote ? { increment: 1 } : { decrement: 1 },
            downvotes: isUpvote ? { decrement: 1 } : { increment: 1 },
          },
        });

        return { action: 'changed', isUpvote };
      }
    }

    // Create new vote
    await this.prisma.suggestionVote.create({
      data: {
        suggestionId,
        userId,
        isUpvote,
      },
    });

    await this.prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        upvotes: isUpvote ? { increment: 1 } : undefined,
        downvotes: !isUpvote ? { increment: 1 } : undefined,
      },
    });

    return { action: 'added', isUpvote };
  }

  async getPendingApproval(query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      isApprovedByModerator: false,
      ticket: { type: TicketType.SUGGESTION },
    };

    const [suggestions, total] = await Promise.all([
      this.prisma.suggestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
              description: true,
              category: true,
              createdAt: true,
              college: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.suggestion.count({ where }),
    ]);

    return {
      data: suggestions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approve(suggestionId: string, moderatorId: string, makePublic: boolean, note?: string) {
    const suggestion = await this.prisma.suggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return this.prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        isApprovedByModerator: true,
        isPublic: makePublic,
        moderatorId,
        moderatedAt: new Date(),
        moderatorNote: note,
      },
    });
  }

  async reject(suggestionId: string, moderatorId: string, note: string) {
    const suggestion = await this.prisma.suggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return this.prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        isApprovedByModerator: false,
        isPublic: false,
        moderatorId,
        moderatedAt: new Date(),
        moderatorNote: note,
      },
    });
  }

  async feature(suggestionId: string) {
    const suggestion = await this.prisma.suggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return this.prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        featuredAt: suggestion.featuredAt ? null : new Date(),
      },
    });
  }

  async createForTicket(ticketId: string) {
    // Check if suggestion already exists
    const existing = await this.prisma.suggestion.findUnique({
      where: { ticketId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.suggestion.create({
      data: {
        ticketId,
        isPublic: false,
        isApprovedByModerator: false,
      },
    });
  }
}

