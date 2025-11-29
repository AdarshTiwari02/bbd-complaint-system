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
import { SuggestionsService } from './suggestions.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Suggestions')
@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get public suggestions (suggestion board)' })
  @ApiResponse({ status: 200, description: 'List of public suggestions' })
  async getPublicSuggestions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('collegeId') collegeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('sortBy') sortBy?: 'upvotes' | 'createdAt',
  ) {
    return this.suggestionsService.getPublicSuggestions({
      page,
      limit,
      collegeId,
      departmentId,
      sortBy,
    });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get suggestion by ID' })
  @ApiResponse({ status: 200, description: 'Suggestion details' })
  async getSuggestionById(@Param('id') id: string) {
    return this.suggestionsService.getSuggestionById(id);
  }

  @Post(':id/vote')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Vote on a suggestion' })
  @ApiResponse({ status: 200, description: 'Vote recorded' })
  async vote(
    @Param('id') id: string,
    @Body('isUpvote') isUpvote: boolean,
    @CurrentUser('sub') userId: string,
  ) {
    return this.suggestionsService.vote(id, userId, isUpvote);
  }

  @Get('moderation/pending')
  @ApiBearerAuth('JWT-auth')
  @Roles('MODERATOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get suggestions pending approval' })
  @ApiResponse({ status: 200, description: 'List of pending suggestions' })
  async getPendingApproval(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.suggestionsService.getPendingApproval({ page, limit });
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Roles('MODERATOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Approve suggestion for public board' })
  @ApiResponse({ status: 200, description: 'Suggestion approved' })
  async approve(
    @Param('id') id: string,
    @Body('makePublic') makePublic: boolean,
    @Body('note') note: string,
    @CurrentUser('sub') moderatorId: string,
  ) {
    return this.suggestionsService.approve(id, moderatorId, makePublic, note);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Roles('MODERATOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Reject suggestion' })
  @ApiResponse({ status: 200, description: 'Suggestion rejected' })
  async reject(
    @Param('id') id: string,
    @Body('note') note: string,
    @CurrentUser('sub') moderatorId: string,
  ) {
    return this.suggestionsService.reject(id, moderatorId, note);
  }

  @Post(':id/feature')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @Roles('MODERATOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Toggle suggestion featured status' })
  @ApiResponse({ status: 200, description: 'Featured status toggled' })
  async feature(@Param('id') id: string) {
    return this.suggestionsService.feature(id);
  }
}

