// src/event-participations/dtos/create-event-participation.dto.ts
import { IsEnum, IsString } from 'class-validator';
import { ParticipationStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventParticipationDto {
  @ApiProperty({
    example: 'd24a67d8-3a0d-41b0-a381-39662f5d50bd',
    description: 'Event ID the user is trying to join',
  })
  @IsString()
  event_id: string;

  @ApiProperty({
    example: 'confirmed',
    enum: ParticipationStatus,
    description: 'Initial status of participation (normally "confirmed")',
  })
  @IsEnum(ParticipationStatus)
  status: ParticipationStatus;
}
