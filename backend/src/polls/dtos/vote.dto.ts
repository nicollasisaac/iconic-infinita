// src/polls/dtos/vote.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class VoteDto {
  @ApiProperty({ example: 'uuid-da-opcao', description: 'ID da opção a favor' })
  @IsString()
  optionId: string;
}
