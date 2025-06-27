import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminCheckinDto {
  @ApiProperty({
    example: '0693d134-af72-483c-a962-e077b1c71729',
    description: 'QR token to be scanned and validated',
  })
  @IsString()
  qr_token: string;
}
