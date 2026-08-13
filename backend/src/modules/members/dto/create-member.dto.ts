import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateMemberDto {
  @IsNumber()
  @IsOptional()
  familyId?: number;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsOptional()
  otherName?: string | null;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsNumber()
  @IsOptional()
  generation?: number | null;

  @IsString()
  @IsOptional()
  role?: string | null;

  @IsOptional()
  dateOfBirth?: string | Date | null;

  @IsBoolean()
  @IsOptional()
  isDeceased?: boolean;

  @IsBoolean()
  @IsOptional()
  isInLaw?: boolean;

  @IsOptional()
  dateOfDeath?: string | Date | null;

  @IsString()
  @IsOptional()
  placeOfBirth?: string | null;

  @IsString()
  @IsOptional()
  currentAddress?: string | null;

  @IsString()
  @IsOptional()
  avatarUrl?: string | null;

  @IsString()
  @IsOptional()
  avatarPublicId?: string | null;

  @IsString()
  @IsOptional()
  education?: string | null;

  @IsString()
  @IsOptional()
  occupation?: string | null;

  @IsString()
  @IsOptional()
  biography?: string | null;

  @IsString()
  @IsOptional()
  note?: string | null;
}
