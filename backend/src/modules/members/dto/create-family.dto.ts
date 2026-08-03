export class CreateFamilyDto {
  name: string;
  originPlace?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  coverImagePublicId?: string | null;
}
