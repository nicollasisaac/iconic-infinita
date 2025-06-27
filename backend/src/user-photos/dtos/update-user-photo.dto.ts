import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateUserPhotoDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  position?: number;
}
