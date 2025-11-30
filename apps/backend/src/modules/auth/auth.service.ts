import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { MfaService } from './mfa.service';
import { WinstonLoggerService } from '../../common/logger/winston-logger.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mfaService: MfaService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerifyToken = uuidv4();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        studentId: dto.studentId,
        employeeId: dto.employeeId,
        campusId: dto.campusId,
        collegeId: dto.collegeId,
        departmentId: dto.departmentId,
        emailVerifyToken,
        status: 'PENDING_VERIFICATION',
      },
    });

    // Assign default role
    const defaultRole = await this.prisma.role.findUnique({
      where: { name: dto.role || 'STUDENT' },
    });

    if (defaultRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultRole.id,
        },
      });
    }

    // TODO: Send verification email via notification queue

    this.logger.log(`New user registered: ${user.email}`, 'AuthService');

    // Get role display name for message
    const roleName = defaultRole?.displayName || 'User';
    
    return {
      message: `Registration successful! Your account is pending verification. A ${this.getVerifierRole(dto.role || 'STUDENT')} will review and approve your registration.`,
      userId: user.id,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account is temporarily locked. Please try again later.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified (skip in development)
    const isDev = this.configService.get('NODE_ENV') === 'development';
    if (!user.emailVerified && !isDev) {
      throw new ForbiddenException('Please verify your email before logging in');
    }

    // Check if account is verified by a superior (skip in development)
    if (!user.isVerified && !isDev) {
      throw new ForbiddenException('Your account is pending verification by an administrator');
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Your account has been suspended');
    }

    if (user.status === 'INACTIVE' && !isDev) {
      throw new ForbiddenException('Your account is inactive');
    }

    // Handle MFA
    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        return {
          mfaRequired: true,
          message: 'Please provide your MFA code',
        };
      }

      if (!user.mfaSecret) {
        throw new BadRequestException('MFA is enabled but secret is not configured. Please contact support.');
      }

      const isMfaValid = this.mfaService.verifyToken(user.mfaSecret, dto.mfaCode);
      if (!isMfaValid) {
        // Check recovery codes
        const isRecoveryCode = user.recoveryCodes.includes(dto.mfaCode);
        if (isRecoveryCode) {
          // Remove used recovery code
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              recoveryCodes: user.recoveryCodes.filter((code) => code !== dto.mfaCode),
            },
          });
        } else {
          throw new UnauthorizedException('Invalid MFA code');
        }
      }
    }

    // Reset failed login attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent,
        ipAddress,
      },
    });

    const roles = user.roles.map((ur) => ur.role.name);

    this.logger.log(`User logged in: ${user.email}`, 'AuthService');

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        campusId: user.campusId,
        collegeId: user.collegeId,
        departmentId: user.departmentId,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
    };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
          },
        },
      },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.user);

    // Store new refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: storedToken.userAgent,
        ipAddress: storedToken.ipAddress,
      },
    });

    return { tokens };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { isRevoked: true },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send password reset email via notification queue

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    this.logger.log(`Password reset for user: ${user.email}`, 'AuthService');

    return { message: 'Password reset successful' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        status: 'ACTIVE',
      },
    });

    return { message: 'Email verified successfully' };
  }

  private async handleFailedLogin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const newAttempts = user.loginAttempts + 1;
    const maxAttempts = 5;

    const updateData: Record<string, unknown> = { loginAttempts: newAttempts };

    if (newAttempts >= maxAttempts) {
      updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      this.logger.warn(`Account locked due to failed attempts: ${user.email}`, 'AuthService');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    roles?: Array<{ role: { name: string } }>;
    campusId?: string | null;
    collegeId?: string | null;
    departmentId?: string | null;
  }) {
    const roles = user.roles?.map((ur) => ur.role.name) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      campusId: user.campusId,
      collegeId: user.collegeId,
      departmentId: user.departmentId,
    };

    const accessToken = this.jwtService.sign(
      { ...payload, type: 'access' },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private getVerifierRole(userRole: string): string {
    const verifierMap: Record<string, string> = {
      STUDENT: 'Class Coordinator',
      STAFF: 'Head of Department (HOD)',
      FACULTY: 'Head of Department (HOD)',
      CLASS_COORDINATOR: 'Head of Department (HOD)',
      PROCTOR: 'Director or Dean',
      HOD: 'Director or Dean',
      DEAN: 'System Administrator',
      DIRECTOR: 'System Administrator',
      DIRECTOR_FINANCE: 'System Administrator',
      TRANSPORT_INCHARGE: 'System Administrator',
      HOSTEL_WARDEN: 'System Administrator',
      CAMPUS_ADMIN: 'System Administrator',
      MODERATOR: 'System Administrator',
    };
    return verifierMap[userRole] || 'Administrator';
  }
}

