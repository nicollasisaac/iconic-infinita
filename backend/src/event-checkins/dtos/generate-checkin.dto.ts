import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateCheckinDto {
  @ApiProperty({
    example: '77035de2-3055-4abe-b56b-6ccca796d3b6',
    description: 'ID of the event for which to generate a QR code',
  })
  @IsString()
  event_id: string;
}
