import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { EVENT_STATUSES, EVENT_VISIBILITIES } from '../entities/event.entity';
import type { EventStatus, EventVisibility } from '../entities/event.entity';

export class CreateEventDto {
  @IsInt()
  @IsOptional()
  relatedMemberId?: number | null;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  eventType?: string;

  @IsIn([...EVENT_STATUSES])
  @IsOptional()
  status?: EventStatus;

  @IsIn([...EVENT_VISIBILITIES])
  @IsOptional()
  visibility?: EventVisibility;

  @IsString()
  @IsNotEmpty()
  startAt!: string | Date;

  @IsString()
  @IsOptional()
  endAt?: string | Date | null;

  @IsString()
  @IsOptional()
  location?: string | null;

  @IsString()
  @IsOptional()
  coverImageUrl?: string | null;

  @IsString()
  @IsOptional()
  coverImagePublicId?: string | null;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurrenceRule?: string | null;
}
