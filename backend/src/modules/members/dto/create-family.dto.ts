import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateFamilyDto {
  @IsNotEmpty({ message: 'Tên gia phả không được để trống' })
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Mã gia phả phải gồm đúng 6 chữ số' })
  familyCode?: string | null;

  @IsOptional()
  @IsString()
  originPlace?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  coverImageUrl?: string | null;
}
