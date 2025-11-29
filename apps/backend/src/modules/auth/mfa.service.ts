import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Configure authenticator
    authenticator.options = {
      digits: 6,
      step: 30,
      window: 1,
    };
  }

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  async generateQrCode(email: string, secret: string): Promise<string> {
    const appName = this.configService.get('MFA_APP_NAME', 'BBD Complaint System');
    const issuer = this.configService.get('MFA_ISSUER', 'BBD Educational Group');
    
    const otpAuthUrl = authenticator.keyuri(email, `${issuer}:${appName}`, secret);
    return QRCode.toDataURL(otpAuthUrl);
  }

  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  generateRecoveryCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateRandomCode(10);
      codes.push(code);
    }
    return codes;
  }

  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async enableMfa(userId: string) {
    const secret = this.generateSecret();
    const recoveryCodes = this.generateRecoveryCodes();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const qrCodeUrl = await this.generateQrCode(user.email, secret);

    // Store secret temporarily (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return {
      secret,
      qrCodeUrl,
      recoveryCodes,
    };
  }

  async verifyAndEnableMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) throw new BadRequestException('MFA setup not initiated');

    const isValid = this.verifyToken(user.mfaSecret, token);
    if (!isValid) throw new BadRequestException('Invalid verification code');

    const recoveryCodes = this.generateRecoveryCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        recoveryCodes,
      },
    });

    return {
      enabled: true,
      recoveryCodes,
    };
  }

  async disableMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaEnabled) throw new BadRequestException('MFA not enabled');

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA secret is not configured');
    }

    const isValid = this.verifyToken(user.mfaSecret, token);
    if (!isValid) throw new BadRequestException('Invalid verification code');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        recoveryCodes: [],
      },
    });

    return { disabled: true };
  }
}

