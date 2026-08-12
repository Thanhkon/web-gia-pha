import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { MemberAttachmentRole } from '../entities/member-attachments.entity';

export class CreateAttachmentDto {
  @IsOptional()
  @IsInt()
  memberId?: number | null;

  @IsOptional()
  @IsInt()
  familyId?: number | null;

  @IsInt()
  @IsNotEmpty()
  userId!: number;

  @IsEnum(MemberAttachmentRole)
  @IsOptional()
  role?: MemberAttachmentRole;
}
