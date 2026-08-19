import { IsOptional, IsString, IsInt, IsObject } from 'class-validator';

export class UpdateFamilyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  originPlace?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsInt()
  generations?: number;

  @IsOptional()
  @IsInt()
  membersCount?: number;

  @IsOptional()
  @IsString()
  coverImageUrl?: string | null;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown> | null;
}
