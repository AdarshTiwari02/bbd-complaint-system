import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Post('classify')
  @ApiOperation({ summary: 'Classify ticket category' })
  @ApiResponse({ status: 200, description: 'Classification result' })
  async classifyTicket(
    @Body() body: { text: string; title?: string; college?: string; department?: string },
  ) {
    return this.aiService.classifyTicket(body.text, body.title, body.college, body.department);
  }

  @Public()
  @Post('priority')
  @ApiOperation({ summary: 'Predict ticket priority' })
  @ApiResponse({ status: 200, description: 'Priority prediction' })
  async predictPriority(
    @Body() body: { text: string; title?: string; category?: string },
  ) {
    return this.aiService.predictPriority(body.text, body.title, body.category as any);
  }

  @Post('moderate')
  @ApiBearerAuth('JWT-auth')
  @Roles('MODERATOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Check content for toxicity' })
  @ApiResponse({ status: 200, description: 'Moderation result' })
  async moderateContent(@Body() body: { text: string }) {
    return this.aiService.moderateContent(body.text);
  }

  @Post('summarize')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Summarize ticket' })
  @ApiResponse({ status: 200, description: 'Summary generated' })
  async summarize(
    @Body() body: { ticketTitle: string; ticketDescription: string; messages?: Array<{ role: string; message: string }> },
  ) {
    return this.aiService.summarizeTicket(body.ticketTitle, body.ticketDescription, body.messages);
  }

  @Public()
  @Post('chatbot')
  @ApiOperation({ summary: 'Chatbot intake conversation' })
  @ApiResponse({ status: 200, description: 'Chatbot response' })
  async chatbot(
    @Body() body: { messages: Array<{ role: 'user' | 'assistant'; content: string }>; currentStep?: string },
  ) {
    return this.aiService.chatbotIntake(body.messages, body.currentStep);
  }

  @Public()
  @Post('enhance')
  @ApiOperation({ summary: 'Enhance complaint/suggestion text' })
  @ApiResponse({ status: 200, description: 'Enhanced text' })
  async enhanceText(
    @Body() body: { text: string; title?: string; type?: 'complaint' | 'suggestion' },
  ) {
    return this.aiService.enhanceText(body.text, body.title, body.type || 'complaint');
  }

  @Get('similar/:ticketId')
  @ApiBearerAuth('JWT-auth')
  @Roles('HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'MODERATOR', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Find similar tickets' })
  @ApiResponse({ status: 200, description: 'Similar tickets' })
  async findSimilar(@Param('ticketId') ticketId: string) {
    return this.aiService.findSimilarTickets(ticketId);
  }
}

