import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { VerificationService } from './verification.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto, AssignRolesDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly verificationService: VerificationService,
  ) {}

  @Get()
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN', 'DIRECTOR', 'HOD')
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getMe(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get(':id')
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN', 'DIRECTOR', 'HOD')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Put('me/profile')
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    // Only allow updating limited fields for own profile
    const { firstName, lastName, phone, avatarUrl } = dto;
    return this.usersService.update(userId, { firstName, lastName, phone, avatarUrl });
  }

  @Delete(':id')
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Post(':id/roles')
  @Roles('CAMPUS_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Assign roles to user' })
  @ApiResponse({ status: 200, description: 'Roles assigned' })
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    return this.usersService.assignRoles(id, dto.roleIds);
  }

  @Get('me/export')
  @ApiOperation({ summary: 'Export own data (GDPR)' })
  @ApiResponse({ status: 200, description: 'User data export' })
  async exportData(@CurrentUser('sub') userId: string) {
    return this.usersService.exportUserData(userId);
  }

  @Post('me/delete-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request account deletion (GDPR)' })
  @ApiResponse({ status: 200, description: 'Deletion request processed' })
  async requestDeletion(@CurrentUser('sub') userId: string) {
    return this.usersService.requestAccountDeletion(userId);
  }

  // ==========================================
  // VERIFICATION ENDPOINTS
  // ==========================================

  @Get('verification/pending')
  @Roles('SYSTEM_ADMIN', 'CAMPUS_ADMIN', 'DIRECTOR', 'DEAN', 'HOD', 'CLASS_COORDINATOR')
  @ApiOperation({ summary: 'Get pending user verifications' })
  @ApiResponse({ status: 200, description: 'List of pending verifications' })
  async getPendingVerifications(@CurrentUser('sub') verifierId: string) {
    return this.verificationService.getPendingVerifications(verifierId);
  }

  @Post('verification/:id/verify')
  @Roles('SYSTEM_ADMIN', 'CAMPUS_ADMIN', 'DIRECTOR', 'DEAN', 'HOD', 'CLASS_COORDINATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a user' })
  @ApiResponse({ status: 200, description: 'User verified' })
  async verifyUser(
    @Param('id') userId: string,
    @CurrentUser('sub') verifierId: string,
    @Body() body: { note?: string },
  ) {
    return this.verificationService.verifyUser(userId, verifierId, body.note);
  }

  @Post('verification/:id/reject')
  @Roles('SYSTEM_ADMIN', 'CAMPUS_ADMIN', 'DIRECTOR', 'DEAN', 'HOD', 'CLASS_COORDINATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a user verification' })
  @ApiResponse({ status: 200, description: 'User rejected' })
  async rejectUser(
    @Param('id') userId: string,
    @CurrentUser('sub') verifierId: string,
    @Body() body: { reason: string },
  ) {
    return this.verificationService.rejectUser(userId, verifierId, body.reason);
  }

  @Get('verification/requirements/:role')
  @ApiOperation({ summary: 'Get verification requirements for a role' })
  @ApiResponse({ status: 200, description: 'Verification requirements' })
  async getVerificationRequirements(@Param('role') role: string) {
    return this.verificationService.getVerificationRequirements(role);
  }
}

