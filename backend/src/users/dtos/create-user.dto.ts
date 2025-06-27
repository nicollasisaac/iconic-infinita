import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  IsBoolean,
  IsUrl,
  IsDateString
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Nicollas Isaac' })
  @IsString()
  @Length(3, 100)
  full_name: string;

  @ApiProperty({ example: 'nick@example.com' })
  @IsEmail()
  email: string;

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
  is_iconic?: boolean;

  @ApiPropertyOptional({ example: 'nickzin' })
  @IsOptional()
  @IsString()
  @Length(3, 30)
  nickname?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;
}
