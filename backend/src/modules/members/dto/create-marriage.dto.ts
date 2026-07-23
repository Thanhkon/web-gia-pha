export class CreateMarriageDto {
  memberAId: number;
  memberBId: number;
  status?: string;
  marriedAt?: string | Date | null;
  endedAt?: string | Date | null;
}
