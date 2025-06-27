import {
  IsOptional,
  IsString,
  IsBoolean,
  Length,
  IsUrl,
  IsDateString
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Nicollas Isaac' })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  full_name?: string;

  @ApiPropertyOptional({ example: '+5511999999999' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ example: '@nicollas' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({
    example: 'https://images.com/meu-avatar.png',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  profile_picture_url?: string;

  @ApiPropertyOptional({ example: 'Sou um profissional de eventos' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  show_public_profile?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  show_profile_to_iconics?: boolean;

  @ApiPropertyOptional({ example: 'nickzinho' })
  @IsOptional()
  @IsString()
  @Length(3, 30)
  nickname?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;
}
