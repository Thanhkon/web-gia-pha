import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MemberAttachment,
  MemberAttachmentRole,
} from './entities/member-attachments.entity';
import { CreateAttachmentDto } from './dto/create-attachments.dto';
import { UpdateAttachmentDto } from './dto/update-attachments.dto';

@Injectable()
export class MemberAttachmentsService {
  constructor(
    @InjectRepository(MemberAttachment)
    private readonly attachmentRepository: Repository<MemberAttachment>,
  ) {}

  async create(dto: CreateAttachmentDto): Promise<MemberAttachment> {
    const existing = await this.attachmentRepository.findOne({
      where: { memberId: dto.memberId },
    });

    if (existing) {
      throw new ConflictException(
        `Member #${dto.memberId} đã được gán cho user khác quản lý`,
      );
    }

    const access = this.attachmentRepository.create({
      memberId: dto.memberId,
      userId: dto.userId,
      role: dto.role ?? MemberAttachmentRole.VIEWER,
    });

    return this.attachmentRepository.save(access);
  }

  async findAllByUser(userId: number): Promise<MemberAttachment[]> {
    return this.attachmentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByMember(memberId: number): Promise<MemberAttachment | null> {
    return this.attachmentRepository.findOne({ where: { memberId } });
  }

  async findOne(id: number): Promise<MemberAttachment> {
    const access = await this.attachmentRepository.findOne({ where: { id } });

    if (!access) {
      throw new NotFoundException(`Access link #${id} not found`);
    }

    return access;
  }

  async update(
    id: number,
    dto: UpdateAttachmentDto,
  ): Promise<MemberAttachment> {
    const access = await this.findOne(id);
    Object.assign(access, dto);
    return this.attachmentRepository.save(access);
  }

  async remove(id: number): Promise<void> {
    const access = await this.findOne(id);
    await this.attachmentRepository.remove(access);
  }

  // Helper dùng ở các module khác (ví dụ members.service.ts) để kiểm tra
  // 1 user có quyền EDITOR trên 1 member cụ thể hay không trước khi cho sửa.
  async canEdit(userId: number, memberId: number): Promise<boolean> {
    const access = await this.attachmentRepository.findOne({
      where: { memberId, userId },
    });

    return !!access && access.role === MemberAttachmentRole.EDITOR;
  }
}
