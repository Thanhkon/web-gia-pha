import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMarriageDto {
  @IsInt()
  @IsNotEmpty()
  memberAId!: number;

  @IsInt()
  @IsNotEmpty()
  memberBId!: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  marriedAt?: string | Date | null;

  @IsString()
  @IsOptional()
  endedAt?: string | Date | null;
}
