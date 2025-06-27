import {
  IsString,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUrl,
  IsNumber,
  Length,
  IsISO8601,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventCategory } from '@prisma/client';

export class CreateEventDto {
  /* ------------------ BASICS ------------------ */
  @ApiProperty({ example: 'ICONIC Drop – Edição São Paulo' })
  @IsString()
  @Length(3, 120)
  title: string;

  @ApiProperty({ example: 'O evento mais aguardado da temporada ICONIC.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Rua Augusta, 1500 – São Paulo, SP' })
  @IsString()
  @Length(3, 200)
  location: string;

  /* ---------- GEO (Nominatim) ---------- */
  @ApiPropertyOptional({ example: -23.561693 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -46.716551 })
  @IsOptional()
  @IsNumber()
  lon?: number;

  /* ------------------ DATES ------------------- */
  @ApiProperty({
    example: '2025-07-15T18:30:00-03:00',
    description: 'ISO-8601 de início (start_at)',
  })
  @IsISO8601()
  start_at: string;

  @ApiPropertyOptional({
    example: '2025-07-15T23:00:00-03:00',
    description: 'ISO-8601 de término (opcional)',
  })
  @IsOptional()
  @IsISO8601()
  end_at?: string;

  /* ------------------ META -------------------- */
  @ApiProperty({ example: 'party', enum: EventCategory })
  @IsEnum(EventCategory)
  category: EventCategory;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_exclusive: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_public: boolean;

  @ApiProperty({ example: 200 })
  @IsInt()
  max_attendees: number;

  /* ------------------ PARTNER ----------------- */
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

  /* ------------------ MEDIA ------------------- */
  @ApiPropertyOptional({
    example: 'https://storage.supabase.com/events/banner-drop123.jpg',
    description:
      'URL da imagem de capa (opcional – placeholder usado se vazio)',
  })
  @IsOptional()
  @IsUrl()
  cover_image_url?: string;
}
