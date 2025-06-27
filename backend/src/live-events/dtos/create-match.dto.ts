// src/matchmaking/dtos/create-match.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
export class CreateMatchDto {
  @ApiProperty({ example: 2, description: 'Tamanho de cada grupo' })
  @IsInt()
  @Min(2)
  groupSize: number;
}
