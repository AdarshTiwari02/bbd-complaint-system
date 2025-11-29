import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'student@bbdu.edu.in',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'MFA code (if MFA is enabled)',
  })
  @IsOptional()
  @IsString()
  @Length(6, 10)
  mfaCode?: string;
}

