// src/polls/dtos/create-poll.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  ArrayMinSize,
  ArrayNotEmpty,
} from 'class-validator';
export class CreatePollDto {
  @ApiProperty({ example: 'Qual sua cor favorita?' })
  @IsString()
  question: string;
  @ApiProperty({ example: 30, description: 'Duração em segundos' })
  @IsInt()
  @Min(1)
  durationSec: number;
  @ApiProperty({ example: 0, description: 'Ordem no live event' })
  @IsInt()
  @Min(0)
  order: number;
  @ApiProperty({
    example: ['Azul', 'Vermelho'],
    description: 'Opções de resposta',
  })
  @ArrayNotEmpty()
  @ArrayMinSize(2)
  options: string[];
}
