import { HonorStatus } from '../entities/honor.entity';

export class CreateHonorDto {
  memberId: number;
  title: string;
  honorType?: string;
  description?: string | null;
  achievement?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  documentUrl?: string | null;
  awardedAt?: string | Date | null;
  startAt?: string | Date | null;
  endAt?: string | Date | null;
  status?: HonorStatus;
  displayOrder?: number;
}
