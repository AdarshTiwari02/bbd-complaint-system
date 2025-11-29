import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class EscalateDto {
  @ApiProperty({
    example: 'Issue requires higher authority approval for resolution',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}

