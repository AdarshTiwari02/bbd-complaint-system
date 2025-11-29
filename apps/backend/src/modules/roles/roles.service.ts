import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const ROLE_PERMISSIONS = {
  STUDENT: ['ticket:create', 'ticket:read'],
  STAFF: ['ticket:create', 'ticket:read'],
  HOD: [
    'ticket:create',
    'ticket:read',
    'ticket:update',
    'ticket:assign',
    'ticket:escalate',
    'ticket:resolve',
    'analytics:view',
  ],
  DIRECTOR: [
    'ticket:create',
    'ticket:read',
    'ticket:read:all',
    'ticket:update',
    'ticket:assign',
    'ticket:escalate',
    'ticket:resolve',
    'ticket:close',
    'analytics:view',
    'analytics:export',
  ],
  TRANSPORT_INCHARGE: [
    'ticket:read',
    'ticket:update',
    'ticket:assign',
    'ticket:escalate',
    'ticket:resolve',
  ],
  HOSTEL_WARDEN: [
    'ticket:read',
    'ticket:update',
    'ticket:assign',
    'ticket:escalate',
    'ticket:resolve',
  ],
  MODERATOR: [
    'ticket:read',
    'ticket:read:all',
    'moderation:view',
    'moderation:approve',
    'moderation:reject',
    'suggestion:approve',
    'suggestion:feature',
  ],
  CAMPUS_ADMIN: [
    'ticket:create',
    'ticket:read',
    'ticket:read:all',
    'ticket:update',
    'ticket:delete',
    'ticket:assign',
    'ticket:escalate',
    'ticket:resolve',
    'ticket:close',
    'ticket:reopen',
    'user:read',
    'user:update',
    'user:manage-roles',
    'org:read',
    'org:update',
    'analytics:view',
    'analytics:export',
    'moderation:view',
    'moderation:approve',
    'moderation:reject',
    'suggestion:approve',
    'suggestion:feature',
  ],
  SYSTEM_ADMIN: ['admin:full-access', 'system:config'],
};

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      ...role,
      users: role.users.map((ur) => ur.user),
    };
  }

  async seedRoles() {
    const roles = [
      { name: 'STUDENT', displayName: 'Student', description: 'Student user' },
      { name: 'STAFF', displayName: 'Staff', description: 'Staff member' },
      { name: 'HOD', displayName: 'Head of Department', description: 'Department head' },
      { name: 'DIRECTOR', displayName: 'Director', description: 'College director' },
      { name: 'TRANSPORT_INCHARGE', displayName: 'Transport Incharge', description: 'Transport department head' },
      { name: 'HOSTEL_WARDEN', displayName: 'Hostel Warden', description: 'Hostel warden' },
      { name: 'MODERATOR', displayName: 'Moderator', description: 'Content moderator' },
      { name: 'CAMPUS_ADMIN', displayName: 'Campus Administrator', description: 'Campus administrator' },
      { name: 'SYSTEM_ADMIN', displayName: 'System Administrator', description: 'System administrator' },
    ];

    for (const role of roles) {
      await this.prisma.role.upsert({
        where: { name: role.name as keyof typeof ROLE_PERMISSIONS },
        update: {
          displayName: role.displayName,
          description: role.description,
          permissions: ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS],
        },
        create: {
          name: role.name as keyof typeof ROLE_PERMISSIONS,
          displayName: role.displayName,
          description: role.description,
          permissions: ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS],
          isSystem: true,
        },
      });
    }

    return { message: 'Roles seeded successfully' };
  }

  async updatePermissions(roleId: string, permissions: string[]) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem && role.name === 'SYSTEM_ADMIN') {
      throw new ConflictException('Cannot modify system admin role');
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: { permissions },
    });
  }
}

