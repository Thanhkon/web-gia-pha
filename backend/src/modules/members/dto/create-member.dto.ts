export class CreateMemberDto {
  familyId?: number;
  fullName: string;
  otherName?: string | null;
  gender?: string;
  generation?: number | null;
  role?: string | null;
  dateOfBirth?: string | Date | null;
  isDeceased?: boolean;
  isInLaw?: boolean;
  dateOfDeath?: string | Date | null;
  placeOfBirth?: string | null;
  currentAddress?: string | null;
  avatarUrl?: string | null;
  education?: string | null;
  occupation?: string | null;
  biography?: string | null;
  note?: string | null;
}
