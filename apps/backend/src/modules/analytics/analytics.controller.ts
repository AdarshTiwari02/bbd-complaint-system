import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiResponse({ status: 200, description: 'Analytics overview' })
  async getOverview(
    @Query('campusId') campusId?: string,
    @Query('collegeId') collegeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getOverview({
      campusId,
      collegeId,
      departmentId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('by-college')
  @Roles('DIRECTOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get analytics by college' })
  @ApiResponse({ status: 200, description: 'Analytics by college' })
  async getByCollege(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getByCollege({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('by-department')
  @Roles('HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get analytics by department' })
  @ApiResponse({ status: 200, description: 'Analytics by department' })
  async getByDepartment(
    @Query('collegeId') collegeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.analyticsService.getByDepartment(collegeId, {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('sla')
  @Roles('HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get SLA analytics' })
  @ApiResponse({ status: 200, description: 'SLA analytics' })
  async getSlaAnalytics(
    @Query('collegeId') collegeId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.analyticsService.getSlaAnalytics({ collegeId, departmentId });
  }

  @Get('satisfaction')
  @Roles('HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get satisfaction analytics' })
  @ApiResponse({ status: 200, description: 'Satisfaction analytics' })
  async getSatisfactionAnalytics(
    @Query('collegeId') collegeId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.analyticsService.getSatisfactionAnalytics({ collegeId, departmentId });
  }

  @Get('heatmap')
  @Roles('HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get ticket creation heatmap' })
  @ApiResponse({ status: 200, description: 'Heatmap data' })
  async getHeatmap(
    @Query('collegeId') collegeId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.analyticsService.getHeatmap({ collegeId, departmentId });
  }

  @Get('ai-insights')
  @Roles('DIRECTOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get AI-generated insights' })
  @ApiResponse({ status: 200, description: 'AI insights' })
  async getAiInsights(
    @Query('collegeId') collegeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getAiInsights({ collegeId, departmentId, days });
  }

  @Get('trends')
  @Roles('HOD', 'DIRECTOR', 'CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get trends by period' })
  @ApiResponse({ status: 200, description: 'Trend data' })
  async getTrends(
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
    @Query('collegeId') collegeId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.analyticsService.getTrendsByPeriod(period, { collegeId, departmentId });
  }
}

