// src/live-events/dtos/create-live-event.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateLiveEventDto {
  @ApiProperty({ example: 'Dinâmica de Perguntas' })
  @IsString()
  @Length(3, 120)
  title: string;

  @ApiPropertyOptional({ description: 'Se true, só quem fez check-in vê', default: false })
  @IsBoolean()
  @IsOptional()
  require_qr?: boolean;
}
