import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class MfaVerifyDto {
  @ApiProperty({
    example: '123456',
    description: 'MFA verification code (6 digits) or recovery code',
  })
  @IsString()
  @Length(6, 10)
  code: string;
}

