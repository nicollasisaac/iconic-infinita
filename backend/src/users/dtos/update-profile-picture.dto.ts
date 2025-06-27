import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class UpdateProfilePictureDto {
  @ApiProperty({
    example: 'https://your-supabase-url/storage/v1/object/public/user-photos/USER_ID/filename.jpg',
    description: 'URL da nova foto de perfil já salva no Supabase Storage',
  })
  @IsString()
  @IsUrl()
  url: string;
}
