import { IsEnum, IsOptional } from 'class-validator';
import { MemberAttachmentRole } from '../entities/member-attachments.entity';

// Chỉ cho phép đổi role. Muốn đổi memberId/userId thì xoá và tạo lại liên kết mới.
export class UpdateAttachmentDto {
  @IsEnum(MemberAttachmentRole)
  @IsOptional()
  role?: MemberAttachmentRole;
}
