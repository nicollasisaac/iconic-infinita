import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsInt,
  IsUrl,
  IsNumber,
  Length,
  IsISO8601,
} from 'class-validator';
import { EventCategory } from '@prisma/client';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  /* ---------- campos básicos opcionalmente editáveis ---------- */
  @ApiPropertyOptional({ example: 'ICONIC Drop – Edição São Paulo' })
  @IsOptional()
  @IsString()
  @Length(3, 120)
  title?: string;

  @ApiPropertyOptional({
    example: 'O evento mais aguardado da temporada ICONIC.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Rua Augusta, 1500 – São Paulo, SP' })
  @IsOptional()
  @IsString()
  location?: string;

  /* ---------- GEO opcionalmente editável ---------- */
  @ApiPropertyOptional({ example: -23.561693 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -46.716551 })
  @IsOptional()
  @IsNumber()
  lon?: number;

  /* ----------------- início / fim ----------------- */
  @ApiPropertyOptional({
    example: '2025-07-15T18:30:00-03:00',
    description: 'ISO-8601 do novo horário de início',
  })
  @IsOptional()
  @IsISO8601()
  start_at?: string;

  @ApiPropertyOptional({
    example: '2025-07-15T23:00:00-03:00',
    description: 'ISO-8601 do novo horário de término',
  })
  @IsOptional()
  @IsISO8601()
  end_at?: string;

  /* ----------------- meta ----------------- */
  @ApiPropertyOptional({ example: 'party', enum: EventCategory })
  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_exclusive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsInt()
  max_attendees?: number;

  /* ---------------- partner / mídia --------------- */
  @ApiPropertyOptional({ example: 'Supreme' })
  @IsOptional()
  @IsString()
  partner_name?: string;

  @ApiPropertyOptional({
    example: 'https://storage.supabase.com/logos/supreme.png',
  })
  @IsOptional()
  @IsUrl()
  partner_logo_url?: string;

  @ApiPropertyOptional({
    example: 'https://storage.supabase.com/events/event123.png',
  })
  @IsOptional()
  @IsUrl()
  cover_image_url?: string;
}
