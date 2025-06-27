import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckinDto {
  @ApiProperty({ example: 'uuid-do-evento' })
  @IsString()
  event_id: string;

  @ApiProperty({ example: 'uuid-do-user' })
  @IsString()
  user_id: string;
}