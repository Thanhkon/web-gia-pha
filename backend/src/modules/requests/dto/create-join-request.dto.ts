import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateJoinRequestDto {
  @IsInt()
  @IsNotEmpty()
  familyId!: number;

  @IsInt()
  @IsNotEmpty()
  targetMemberId!: number;

  @IsString()
  @IsOptional()
  note?: string;
}
