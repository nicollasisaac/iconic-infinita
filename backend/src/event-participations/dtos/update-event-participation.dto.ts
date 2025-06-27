import { IsEnum, IsOptional } from 'class-validator';
import { ParticipationStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEventParticipationDto {
  @ApiPropertyOptional({
    example: 'cancelled',
    enum: ParticipationStatus,
    description: 'Use to cancel the participation',
  })
  @IsOptional()
  @IsEnum(ParticipationStatus)
  status?: ParticipationStatus;
}
