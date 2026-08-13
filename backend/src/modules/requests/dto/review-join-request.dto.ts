import { IsOptional, IsString } from 'class-validator';

export class ReviewJoinRequestDto {
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  adminNote?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
