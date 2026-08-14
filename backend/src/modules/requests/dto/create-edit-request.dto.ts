import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type { EditRequestChanges } from '../entities/edit-request.entity';

export class CreateEditRequestDto {
  @IsInt()
  @IsNotEmpty()
  targetMemberId!: number;

  @IsString()
  @IsOptional()
  requestType?: string;

  @IsObject()
  @IsNotEmpty()
  changes!: EditRequestChanges;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsString()
  @IsNotEmpty()
  submittedByName!: string;

  @IsString()
  @IsOptional()
  submittedByPhone?: string | null;
}
