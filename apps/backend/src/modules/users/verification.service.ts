import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleName } from '@prisma/client';

/**
 * Verification Hierarchy:
 * - SYSTEM_ADMIN verifies: DIRECTOR, DEAN, HOSTEL_WARDEN, TRANSPORT_INCHARGE, DIRECTOR_FINANCE, CAMPUS_ADMIN
 * - DIRECTOR/DEAN verifies: HOD, PROCTOR (of their college)
 * - HOD verifies: STAFF, FACULTY, CLASS_COORDINATOR (of their department)
 * - CLASS_COORDINATOR verifies: STUDENT (of their class/department)
 */

// Define which roles can verify which other roles
const VERIFICATION_HIERARCHY: Record<string, string[]> = {
  SYSTEM_ADMIN: ['DIRECTOR', 'DEAN', 'HOSTEL_WARDEN', 'TRANSPORT_INCHARGE', 'DIRECTOR_FINANCE', 'CAMPUS_ADMIN', 'MODERATOR'],
  DIRECTOR: ['HOD', 'PROCTOR'],
  DEAN: ['HOD', 'PROCTOR'],
  HOD: ['STAFF', 'FACULTY', 'CLASS_COORDINATOR'],
  CLASS_COORDINATOR: ['STUDENT'],
};

// Define which roles need verification from which roles
const VERIFIED_BY: Record<string, string[]> = {
  STUDENT: ['CLASS_COORDINATOR', 'HOD', 'DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'],
  STAFF: ['HOD', 'DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'],
  FACULTY: ['HOD', 'DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'],
  CLASS_COORDINATOR: ['HOD', 'DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'],
  PROCTOR: ['DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'],
  HOD: ['DIRECTOR', 'DEAN', 'SYSTEM_ADMIN'],
  DEAN: ['SYSTEM_ADMIN'],
  DIRECTOR: ['SYSTEM_ADMIN'],
  DIRECTOR_FINANCE: ['SYSTEM_ADMIN'],
  TRANSPORT_INCHARGE: ['SYSTEM_ADMIN'],
  HOSTEL_WARDEN: ['SYSTEM_ADMIN'],
  CAMPUS_ADMIN: ['SYSTEM_ADMIN'],
  MODERATOR: ['SYSTEM_ADMIN'],
};

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get list of pending users that the current user can verify
   */
  async getPendingVerifications(verifierId: string) {
    const verifier = await this.prisma.user.findUnique({
      where: { id: verifierId },
      include: {
        roles: { include: { role: true } },
        college: true,
        department: true,
      },
    });

    if (!verifier) {
      throw new NotFoundException('Verifier not found');
    }

    const verifierRoles = verifier.roles.map(ur => ur.role.name);
    
    // Determine which roles this user can verify
    const canVerifyRoles: string[] = [];
    for (const role of verifierRoles) {
      const rolesCanVerify = VERIFICATION_HIERARCHY[role] || [];
      canVerifyRoles.push(...rolesCanVerify);
    }

    if (canVerifyRoles.length === 0) {
      return { data: [], total: 0 };
    }

    // Build query based on verifier's scope
    const where: Record<string, unknown> = {
      isVerified: false,
      status: 'PENDING_VERIFICATION',
      deletedAt: null,
      roles: {
        some: {
          role: {
            name: { in: canVerifyRoles as RoleName[] },
          },
        },
      },
    };

    // Scope verification based on hierarchy
    // Directors/Deans can only verify users in their college
    if (verifierRoles.includes('DIRECTOR') || verifierRoles.includes('DEAN')) {
      if (verifier.collegeId) {
        where.collegeId = verifier.collegeId;
      }
    }

    // HODs can only verify users in their department
    if (verifierRoles.includes('HOD')) {
      if (verifier.departmentId) {
        where.departmentId = verifier.departmentId;
      }
    }

    // Class coordinators can only verify students in their department
    if (verifierRoles.includes('CLASS_COORDINATOR')) {
      if (verifier.departmentId) {
        where.departmentId = verifier.departmentId;
      }
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          roles: { include: { role: true } },
          campus: { select: { id: true, name: true } },
          college: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map(user => ({
      ...user,
      roles: user.roles.map(ur => ur.role),
      passwordHash: undefined,
      mfaSecret: undefined,
      recoveryCodes: undefined,
    }));

    return { data: formattedUsers, total };
  }

  /**
   * Verify a user
   */
  async verifyUser(userId: string, verifierId: string, note?: string) {
    const [user, verifier] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { roles: { include: { role: true } } },
      }),
      this.prisma.user.findUnique({
        where: { id: verifierId },
        include: { 
          roles: { include: { role: true } },
          college: true,
          department: true,
        },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!verifier) {
      throw new NotFoundException('Verifier not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    // Check if verifier has permission to verify this user
    const verifierRoles = verifier.roles.map(ur => ur.role.name);
    const userRoles = user.roles.map(ur => ur.role.name);

    let canVerify = false;
    for (const vRole of verifierRoles) {
      const rolesCanVerify = VERIFICATION_HIERARCHY[vRole] || [];
      if (userRoles.some(uRole => rolesCanVerify.includes(uRole))) {
        canVerify = true;
        break;
      }
    }

    if (!canVerify) {
      throw new ForbiddenException('You do not have permission to verify this user');
    }

    // Check scope (college/department) for non-system-admin verifiers
    if (!verifierRoles.includes('SYSTEM_ADMIN')) {
      if ((verifierRoles.includes('DIRECTOR') || verifierRoles.includes('DEAN')) && 
          verifier.collegeId !== user.collegeId) {
        throw new ForbiddenException('You can only verify users in your college');
      }
      if (verifierRoles.includes('HOD') && verifier.departmentId !== user.departmentId) {
        throw new ForbiddenException('You can only verify users in your department');
      }
      if (verifierRoles.includes('CLASS_COORDINATOR') && verifier.departmentId !== user.departmentId) {
        throw new ForbiddenException('You can only verify students in your department');
      }
    }

    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        verifiedById: verifierId,
        verifiedAt: new Date(),
        verificationNote: note,
        status: 'ACTIVE',
        emailVerified: true, // Auto-verify email when account is verified
      },
    });

    return { message: 'User verified successfully' };
  }

  /**
   * Reject a user verification
   */
  async rejectUser(userId: string, verifierId: string, reason: string) {
    const [user, verifier] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { roles: { include: { role: true } } },
      }),
      this.prisma.user.findUnique({
        where: { id: verifierId },
        include: { roles: { include: { role: true } } },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!verifier) {
      throw new NotFoundException('Verifier not found');
    }

    // Similar permission check as verify
    const verifierRoles = verifier.roles.map(ur => ur.role.name);
    const userRoles = user.roles.map(ur => ur.role.name);

    let canVerify = false;
    for (const vRole of verifierRoles) {
      const rolesCanVerify = VERIFICATION_HIERARCHY[vRole] || [];
      if (userRoles.some(uRole => rolesCanVerify.includes(uRole))) {
        canVerify = true;
        break;
      }
    }

    if (!canVerify) {
      throw new ForbiddenException('You do not have permission to reject this user');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'INACTIVE',
        rejectionReason: reason,
        verifiedById: verifierId,
      },
    });

    return { message: 'User verification rejected' };
  }

  /**
   * Get verification requirements for a role
   */
  getVerificationRequirements(roleName: string) {
    return {
      role: roleName,
      verifiedBy: VERIFIED_BY[roleName] || [],
      canVerify: VERIFICATION_HIERARCHY[roleName] || [],
    };
  }
}

