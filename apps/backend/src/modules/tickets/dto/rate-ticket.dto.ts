import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class RateTicketDto {
  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Issue was resolved quickly. Great support!' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

