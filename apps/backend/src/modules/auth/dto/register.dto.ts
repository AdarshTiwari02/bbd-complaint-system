import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';

export enum RegisterRole {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
}

export class RegisterDto {
  @ApiProperty({
    example: 'student@bbdu.edu.in',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password (min 8 chars, must contain uppercase, lowercase, number)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and number or special character',
  })
  password: string;

  @ApiProperty({
    example: 'Rahul',
    description: 'First name',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    example: 'Sharma',
    description: 'Last name',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    example: '+91 9876543210',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'BBDU2024001',
    description: 'Student ID (for students)',
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({
    example: 'EMP2024001',
    description: 'Employee ID (for staff)',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Campus ID',
  })
  @IsOptional()
  @IsString()
  campusId?: string;

  @ApiPropertyOptional({
    description: 'College ID',
  })
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional({
    description: 'Department ID',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    enum: RegisterRole,
    default: RegisterRole.STUDENT,
    description: 'User role (STUDENT or STAFF)',
  })
  @IsOptional()
  @IsEnum(RegisterRole)
  role?: RegisterRole;
}

