import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Member } from '../members/entities/member.entity';
import { MemberAttachmentsService } from '../attachment/member-attachments.service';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    private readonly memberAttachmentsService: MemberAttachmentsService,
  ) {}

  /**
   * Kiểm tra userId có quyền EDITOR trên family này không.
   * Admin luôn được coi là có quyền (isAdmin bypass toàn bộ).
   * Quyền editor có thể đến từ: attachment cấp family (memberId = null),
   * hoặc attachment EDITOR trên bất kỳ member nào thuộc family.
   */
  async isFamilyEditor(userId: number, familyId: number): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) return false;
    if (user.isAdmin) return true; // 👈 dùng getter có sẵn trong entity

    const familyLevelEditor = await this.memberAttachmentsService.canEditFamily(
      userId,
      familyId,
    );
    if (familyLevelEditor) return true; // 👈 quyền gán khi tạo family

    const members = await this.membersRepository.find({
      where: { familyId },
    });

    for (const member of members) {
      const canEdit = await this.memberAttachmentsService.canEdit(
        userId,
        member.id,
      );
      if (canEdit) return true;
    }

    return false;
  }

  /** Ném ForbiddenException nếu không có quyền editor trên family */
  async assertFamilyEditor(userId: number, familyId: number): Promise<void> {
    const allowed = await this.isFamilyEditor(userId, familyId);
    if (!allowed) {
      throw new ForbiddenException(
        `Only editors of family ${familyId} can modify this family`,
      );
    }
  }

  /** Tiện dùng khi chỉ có memberId, chưa biết familyId */
  async assertMemberEditor(userId: number, memberId: number): Promise<void> {
    const member = await this.membersRepository.findOne({
      where: { id: memberId },
    });

    if (!member) {
      throw new ForbiddenException(`Member ${memberId} not found`);
    }

    await this.assertFamilyEditor(userId, member.familyId!);
  }

  /** Tiện check nhanh isAdmin ở nơi khác (VD: guard, controller khác) nếu cần */
  async isAdmin(userId: number): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    return user?.isAdmin ?? false;
  }

  /** User có thuộc gia đình này không (viewer hoặc editor đều tính), admin luôn true */
  async isFamilyMember(userId: number, familyId: number): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) return false;
    if (user.isAdmin) return true;

    const familyLevelAccess =
      await this.memberAttachmentsService.hasAccessFamily(userId, familyId);
    if (familyLevelAccess) return true; // 👈 quyền gán khi tạo family

    const members = await this.membersRepository.find({ where: { familyId } });

    for (const member of members) {
      const attachment = await this.memberAttachmentsService.hasAccess(
        userId,
        member.id,
      );
      if (attachment) return true;
    }

    return false;
  }

  async assertFamilyMember(userId: number, familyId: number): Promise<void> {
    const allowed = await this.isFamilyMember(userId, familyId);
    if (!allowed) {
      throw new ForbiddenException(
        `Only members of family ${familyId} can perform this action`,
      );
    }
  }
}
