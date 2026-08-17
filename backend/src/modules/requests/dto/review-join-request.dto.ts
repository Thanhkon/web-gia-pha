import { IsOptional, IsString } from 'class-validator';

export class ReviewJoinRequestDto {
  @IsOptional()
  @IsString()
  adminNote?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
