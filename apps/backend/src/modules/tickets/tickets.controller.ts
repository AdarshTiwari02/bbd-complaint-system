import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CreateMessageDto,
  EscalateDto,
  RateTicketDto,
  TicketQueryDto,
} from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
  sub: string;
  roles: string[];
}

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.ticketsService.create(dto, user.sub, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tickets with filters' })
  @ApiResponse({ status: 200, description: 'List of tickets' })
  async findAll(
    @Query() query: TicketQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.findAll(query, user.sub, user.roles);
  }

  @Public()
  @Get('track/:ticketNumber')
  @ApiOperation({ summary: 'Track ticket by ticket number (public)' })
  @ApiResponse({ status: 200, description: 'Ticket status' })
  async track(@Param('ticketNumber') ticketNumber: string) {
    return this.ticketsService.findByTicketNumber(ticketNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket details' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.findById(id, user.sub, user.roles);
  }

  @Put(':id')
  @Roles('HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'TRANSPORT_INCHARGE', 'HOSTEL_WARDEN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Update ticket' })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.ticketsService.update(id, dto, userId, ipAddress);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to ticket' })
  @ApiResponse({ status: 201, description: 'Message added' })
  async addMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.ticketsService.addMessage(id, dto, userId);
  }

  @Post(':id/escalate')
  @HttpCode(HttpStatus.OK)
  @Roles('HOD', 'DIRECTOR', 'TRANSPORT_INCHARGE', 'HOSTEL_WARDEN')
  @ApiOperation({ summary: 'Escalate ticket to next level' })
  @ApiResponse({ status: 200, description: 'Ticket escalated' })
  async escalate(
    @Param('id') id: string,
    @Body() dto: EscalateDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.ticketsService.escalate(id, dto, userId, ipAddress);
  }

  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rate ticket resolution' })
  @ApiResponse({ status: 200, description: 'Rating submitted' })
  async rate(
    @Param('id') id: string,
    @Body() dto: RateTicketDto,
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    return this.ticketsService.rate(id, dto, userId, ipAddress);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get ticket timeline' })
  @ApiResponse({ status: 200, description: 'Ticket timeline' })
  async getTimeline(@Param('id') id: string) {
    return this.ticketsService.getTimeline(id);
  }

  @Get(':id/similar')
  @Roles('HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Get similar tickets' })
  @ApiResponse({ status: 200, description: 'Similar tickets' })
  async getSimilar(@Param('id') id: string) {
    return this.ticketsService.getSimilarTickets(id);
  }

  @Get(':id/reply-draft')
  @Roles('HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'TRANSPORT_INCHARGE', 'HOSTEL_WARDEN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Generate AI reply draft' })
  @ApiResponse({ status: 200, description: 'Reply draft generated' })
  async getReplyDraft(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.ticketsService.generateReplyDraft(id, userId);
  }
}

