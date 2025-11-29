import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Moderation')
@ApiBearerAuth('JWT-auth')
@Roles('MODERATOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('flagged')
  @ApiOperation({ summary: 'Get flagged tickets' })
  @ApiResponse({ status: 200, description: 'List of flagged tickets' })
  async getFlaggedTickets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('severity') severity?: string,
  ) {
    return this.moderationService.getFlaggedTickets({ page, limit, severity });
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get moderation queue (blocked tickets)' })
  @ApiResponse({ status: 200, description: 'Moderation queue' })
  async getModerationQueue() {
    return this.moderationService.getModerationQueue();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get moderation statistics' })
  @ApiResponse({ status: 200, description: 'Moderation stats' })
  async getModerationStats() {
    return this.moderationService.getModerationStats();
  }

  @Post('tickets/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a flagged ticket' })
  @ApiResponse({ status: 200, description: 'Ticket approved' })
  async approveTicket(
    @Param('id') id: string,
    @CurrentUser('sub') moderatorId: string,
  ) {
    return this.moderationService.approveTicket(id, moderatorId);
  }

  @Post('tickets/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a flagged ticket' })
  @ApiResponse({ status: 200, description: 'Ticket rejected' })
  async rejectTicket(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') moderatorId: string,
  ) {
    return this.moderationService.rejectTicket(id, moderatorId, reason);
  }

  @Post('tickets/:id/remoderate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-run moderation on a ticket' })
  @ApiResponse({ status: 200, description: 'Moderation result' })
  async remoderateTicket(@Param('id') id: string) {
    return this.moderationService.remoderateTicket(id);
  }
}

