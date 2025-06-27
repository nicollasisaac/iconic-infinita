// src/live-events/dtos/update-live-event.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateLiveEventDto } from './create-live-event.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateLiveEventDto extends PartialType(CreateLiveEventDto) {
  @ApiPropertyOptional({ example: 'Título Atualizado' })
  @IsString()
  @Length(3, 120)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Se true, só quem fez check-in vê' })
  @IsBoolean()
  @IsOptional()
  require_qr?: boolean;
}
