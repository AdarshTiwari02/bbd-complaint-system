import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post('seed')
  @Roles('SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Seed default roles' })
  @ApiResponse({ status: 201, description: 'Roles seeded' })
  async seedRoles() {
    return this.rolesService.seedRoles();
  }

  @Put(':id/permissions')
  @Roles('SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Update role permissions' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  async updatePermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.rolesService.updatePermissions(id, permissions);
  }
}

