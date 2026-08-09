import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFamilyDto {
  @IsNotEmpty({ message: 'Tên gia phả không được để trống' })
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  originPlace?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  coverImageUrl?: string | null;

  @IsOptional()
  @IsString()
  coverImagePublicId?: string | null;
}
