import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'student@bbdu.edu.in',
    description: 'Email address for password reset',
  })
  @IsEmail()
  email: string;
}

