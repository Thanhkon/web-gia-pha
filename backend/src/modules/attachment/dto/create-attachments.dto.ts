import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { MemberAttachmentRole } from '../entities/member-attachments.entity';

export class CreateAttachmentDto {
  @IsInt()
  @IsNotEmpty()
  memberId: number;

  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsEnum(MemberAttachmentRole)
  @IsOptional()
  role?: MemberAttachmentRole;
}
