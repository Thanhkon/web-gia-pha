import {
  BadRequestException,
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
    const hasMemberId = dto.memberId !== undefined && dto.memberId !== null;
    const hasFamilyId = dto.familyId !== undefined && dto.familyId !== null;

    if (hasMemberId === hasFamilyId) {
      throw new BadRequestException(
        'Provide exactly one of memberId or familyId',
      );
    }

    if (hasMemberId) {
      const existing = await this.attachmentRepository.findOne({
        where: { memberId: dto.memberId as number },
      });

      if (existing) {
        throw new ConflictException(
          `Member #${dto.memberId} đã được gán cho user khác quản lý`,
        );
      }
    }

    const access = this.attachmentRepository.create({
      memberId: hasMemberId ? dto.memberId! : null,
      familyId: hasFamilyId ? dto.familyId! : null,
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

  async canEdit(userId: number, memberId: number): Promise<boolean> {
    const access = await this.attachmentRepository.findOne({
      where: { memberId, userId },
    });

    return !!access && access.role === MemberAttachmentRole.EDITOR;
  }

  async hasAccess(userId: number, memberId: number): Promise<boolean> {
    const access = await this.attachmentRepository.findOne({
      where: { memberId, userId },
    });

    return !!access;
  }

  async canEditFamily(userId: number, familyId: number): Promise<boolean> {
    const access = await this.attachmentRepository.findOne({
      where: { familyId, userId },
    });

    return !!access && access.role === MemberAttachmentRole.EDITOR;
  }

  async hasAccessFamily(userId: number, familyId: number): Promise<boolean> {
    const access = await this.attachmentRepository.findOne({
      where: { familyId, userId },
    });

    return !!access;
  }

  async createFamilyEditor(
    familyId: number,
    userId: number,
    memberId?: number,
  ): Promise<MemberAttachment> {
    const access = this.attachmentRepository.create({
      memberId: memberId || null,
      familyId,
      userId,
      role: MemberAttachmentRole.EDITOR,
    });

    return this.attachmentRepository.save(access);
  }

  async createFamilyViewer(
    familyId: number,
    userId: number,
    memberId?: number,
  ): Promise<MemberAttachment> {
    const access = this.attachmentRepository.create({
      memberId: memberId || null,
      familyId,
      userId,
      role: MemberAttachmentRole.VIEWER,
    });

    return this.attachmentRepository.save(access);
  }

  // Liên kết tài khoản User trực tiếp với Member trong sơ đồ (memberId != null, familyId = null)
  async createMemberAttachment(
    memberId: number,
    userId: number,
    role: MemberAttachmentRole = MemberAttachmentRole.EDITOR,
  ): Promise<MemberAttachment> {
    const access = this.attachmentRepository.create({
      memberId,
      familyId: null,
      userId,
      role,
    });

    return this.attachmentRepository.save(access);
  }
}
