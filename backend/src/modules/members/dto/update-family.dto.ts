export class UpdateFamilyDto {
  name?: string;
  originPlace?: string | null;
  description?: string | null;

  generations?: number;
  membersCount?: number;

  coverImageUrl?: string | null;
}