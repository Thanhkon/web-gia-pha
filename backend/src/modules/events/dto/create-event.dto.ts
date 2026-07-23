import { EventStatus, EventVisibility } from '../entities/event.entity';

export class CreateEventDto {
  relatedMemberId?: number | null;
  title: string;
  description?: string | null;
  eventType?: string;
  status?: EventStatus;
  visibility?: EventVisibility;
  startAt: string | Date;
  endAt?: string | Date | null;
  location?: string | null;
  coverImageUrl?: string | null;
  isRecurring?: boolean;
  recurrenceRule?: string | null;
}
