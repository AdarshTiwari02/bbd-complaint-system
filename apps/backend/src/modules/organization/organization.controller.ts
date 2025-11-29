import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import {
  CreateCampusDto,
  UpdateCampusDto,
  CreateCollegeDto,
  UpdateCollegeDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Organization')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // ===========================================
  // CAMPUS ENDPOINTS
  // ===========================================

  @Public()
  @Get('campuses')
  @ApiOperation({ summary: 'Get all campuses' })
  @ApiResponse({ status: 200, description: 'List of campuses' })
  async getAllCampuses() {
    return this.organizationService.getAllCampuses();
  }

  @Public()
  @Get('campuses/:id')
  @ApiOperation({ summary: 'Get campus by ID' })
  @ApiResponse({ status: 200, description: 'Campus details' })
  async getCampusById(@Param('id') id: string) {
    return this.organizationService.getCampusById(id);
  }

  @Post('campuses')
  @ApiBearerAuth('JWT-auth')
  @Roles('SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Create a new campus' })
  @ApiResponse({ status: 201, description: 'Campus created' })
  async createCampus(@Body() dto: CreateCampusDto) {
    return this.organizationService.createCampus(dto);
  }

  @Put('campuses/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Update campus' })
  @ApiResponse({ status: 200, description: 'Campus updated' })
  async updateCampus(@Param('id') id: string, @Body() dto: UpdateCampusDto) {
    return this.organizationService.updateCampus(id, dto);
  }

  // ===========================================
  // COLLEGE ENDPOINTS
  // ===========================================

  @Public()
  @Get('colleges')
  @ApiOperation({ summary: 'Get all colleges' })
  @ApiResponse({ status: 200, description: 'List of colleges' })
  async getAllColleges(@Query('campusId') campusId?: string) {
    return this.organizationService.getAllColleges(campusId);
  }

  @Public()
  @Get('colleges/:id')
  @ApiOperation({ summary: 'Get college by ID' })
  @ApiResponse({ status: 200, description: 'College details' })
  async getCollegeById(@Param('id') id: string) {
    return this.organizationService.getCollegeById(id);
  }

  @Post('colleges')
  @ApiBearerAuth('JWT-auth')
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Create a new college' })
  @ApiResponse({ status: 201, description: 'College created' })
  async createCollege(@Body() dto: CreateCollegeDto) {
    return this.organizationService.createCollege(dto);
  }

  @Put('colleges/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN', 'DIRECTOR')
  @ApiOperation({ summary: 'Update college' })
  @ApiResponse({ status: 200, description: 'College updated' })
  async updateCollege(@Param('id') id: string, @Body() dto: UpdateCollegeDto) {
    return this.organizationService.updateCollege(id, dto);
  }

  // ===========================================
  // DEPARTMENT ENDPOINTS
  // ===========================================

  @Public()
  @Get('departments')
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200, description: 'List of departments' })
  async getAllDepartments(@Query('collegeId') collegeId?: string) {
    return this.organizationService.getAllDepartments(collegeId);
  }

  @Public()
  @Get('departments/:id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({ status: 200, description: 'Department details' })
  async getDepartmentById(@Param('id') id: string) {
    return this.organizationService.getDepartmentById(id);
  }

  @Post('departments')
  @ApiBearerAuth('JWT-auth')
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN', 'DIRECTOR')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department created' })
  async createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organizationService.createDepartment(dto);
  }

  @Put('departments/:id')
  @ApiBearerAuth('JWT-auth')
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN', 'DIRECTOR')
  @ApiOperation({ summary: 'Update department' })
  @ApiResponse({ status: 200, description: 'Department updated' })
  async updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.organizationService.updateDepartment(id, dto);
  }

  // ===========================================
  // SEED ENDPOINT
  // ===========================================

  @Post('seed')
  @ApiBearerAuth('JWT-auth')
  @Roles('SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Seed organization data' })
  @ApiResponse({ status: 201, description: 'Organization data seeded' })
  async seedOrganization() {
    return this.organizationService.seedOrganization();
  }
}

