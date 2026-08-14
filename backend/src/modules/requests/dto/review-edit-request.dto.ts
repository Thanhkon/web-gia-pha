import { IsOptional, IsString } from 'class-validator';

export class ReviewEditRequestDto {
  @IsString()
  @IsOptional()
  reviewedBy?: string | null;

  @IsString()
  @IsOptional()
  adminNote?: string | null;
}
