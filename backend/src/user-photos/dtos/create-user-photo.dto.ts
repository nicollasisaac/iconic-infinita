import { IsInt, IsString, Min, Max } from 'class-validator';

export class CreateUserPhotoDto {
  @IsString()
  url: string;

  @IsInt()
  @Min(1)
  @Max(6)
  position: number;
}