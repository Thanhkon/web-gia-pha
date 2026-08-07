import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { MemberAttachmentRole } from '../entities/member-attachments.entity';

export class CreateAttachmentDto {
  // Cung cấp ĐÚNG 1 trong 2: memberId (gán quyền trên 1 member)
  // hoặc familyId (gán quyền trên cả gia phả). Validate ở service.
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
