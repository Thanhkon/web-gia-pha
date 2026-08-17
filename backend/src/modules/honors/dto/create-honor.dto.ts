import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HONOR_STATUSES } from '../entities/honor.entity';
import type { HonorStatus } from '../entities/honor.entity';

export class CreateHonorDto {
  @IsInt()
  @IsNotEmpty()
  memberId!: number;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  honorType?: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  achievement?: string | null;

  @IsString()
  @IsOptional()
  imageUrl?: string | null;

  @IsString()
  @IsOptional()
  imagePublicId?: string | null;

  @IsString()
  @IsOptional()
  documentUrl?: string | null;

  @IsString()
  @IsOptional()
  awardedAt?: string | Date | null;

  @IsString()
  @IsOptional()
  startAt?: string | Date | null;

  @IsString()
  @IsOptional()
  endAt?: string | Date | null;

  @IsIn([...HONOR_STATUSES])
  @IsOptional()
  status?: HonorStatus;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
