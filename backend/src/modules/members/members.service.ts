import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StorageService } from '../../common/storage/storage.service';
import { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { PermissionsService } from '../permissions/permissions.service';
import { MemberAttachmentsService } from '../attachment/member-attachments.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { CreateMarriageDto } from './dto/create-marriage.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateParentChildRelationDto } from './dto/create-parent-child-relation.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Family } from './entities/family.entity';
import { Marriage } from './entities/marriage.entity';
import { Member } from './entities/member.entity';
import { ParentChildRelation } from './entities/parent-child-relation.entity';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityAction } from '../activity-logs/entities/activity-log.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(ParentChildRelation)
    private readonly parentChildRepository: Repository<ParentChildRelation>,
    @InjectRepository(Marriage)
    private readonly marriagesRepository: Repository<Marriage>,
    private readonly storageService: StorageService,
    private readonly permissionsService: PermissionsService,
    private readonly memberAttachmentsService: MemberAttachmentsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAllFamilies(userId: number) {
    const families = await this.familiesRepository
      .createQueryBuilder('family')
      .leftJoin(
        'member_attachments',
        'attachment',
        'attachment.familyId = family.id',
      )
      .leftJoin('members', 'member', 'member.familyId = family.id')
      .where('attachment.userId = :userId OR member.userId = :userId', {
        userId,
      })
      .orderBy('family.createdAt', 'DESC')
      .distinct(true)
      .getMany();

    const attachments =
      await this.memberAttachmentsService.findAllByUser(userId);
    const roleMap = new Map(attachments.map((a) => [a.familyId, a.role]));

    return families.map((family) => ({
      ...family,
      role: roleMap.get(family.id) || 'viewer',
    }));
  }

  // Sinh mã gia phả ngẫu nhiên 6 chữ số và đảm bảo không bị trùng trong Database
  private async generateUniqueFamilyCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      code = Math.floor(100000 + Math.random() * 900000).toString();

      const existing = await this.familiesRepository.findOne({
        where: { familyCode: code },
      });

      if (!existing) {
        isUnique = true;
        return code;
      }

      attempts++;
    }

    throw new BadRequestException(
      'Không thể khởi tạo mã gia phả, vui lòng thử lại',
    );
  }

  async createFamily(createFamilyDto: CreateFamilyDto, userId: number) {
    if (!createFamilyDto.name?.trim()) {
      throw new BadRequestException('Family name is required');
    }

    try {
      // 1. Sinh mã gia phả 6 số ngẫu nhiên duy nhất
      const familyCode = await this.generateUniqueFamilyCode();

      // 2. Tạo bản ghi Gia phả
      const family = this.familiesRepository.create({
        name: createFamilyDto.name.trim(),
        originPlace: createFamilyDto.originPlace?.trim() || null,
        description: createFamilyDto.description?.trim() || null,
        coverImageUrl: createFamilyDto.coverImageUrl || null,
        familyCode,
      });

      const savedFamily = await this.familiesRepository.save(family);

      // 3. Tự động tạo bản ghi Thành viên (Đời 1) đại diện cho User tạo gia phả
      const initialMember = this.membersRepository.create({
        fullName: `Chủ hộ (${createFamilyDto.name.trim()})`,
        userId: userId,
        familyId: savedFamily.id,
        generation: 1,
      });

      const savedMember = await this.membersRepository.save(initialMember);

      // 4. Tạo đúng 1 bản ghi phân quyền duy nhất chứa cả familyId và memberId
      try {
        await this.memberAttachmentsService.createFamilyEditor(
          savedFamily.id,
          userId,
          savedMember.id, // Truyền memberId vào đây
        );
      } catch (editorError) {
        console.warn(
          `Could not assign attachment for userId ${userId}:`,
          (editorError as Error).message,
        );
      }

      return savedFamily;
    } catch (error) {
      console.error('Error creating family in database:', error);
      throw new BadRequestException(
        (error as Error).message || 'Không thể tạo gia phả mới',
      );
    }
  }

  async findFamilyByCode(code: string) {
    const family = await this.familiesRepository.findOne({
      where: { familyCode: code.trim() },
    });

    if (!family) {
      throw new NotFoundException(`Không tìm thấy gia phả với mã ${code}`);
    }

    return family || null;
  }

  async findOneFamily(id: number) {
    const family = await this.familiesRepository.findOne({ where: { id } });
    if (!family) {
      throw new NotFoundException(`Family ${id} not found`);
    }
    return family;
  }

  async updateFamily(
    id: number,
    userId: number,
    updateFamilyDto: UpdateFamilyDto,
  ) {
    const family = await this.findOneFamily(id);

    await this.permissionsService.assertFamilyEditor(userId, id);

    if (updateFamilyDto.name !== undefined && !updateFamilyDto.name.trim()) {
      throw new BadRequestException('Family name cannot be empty');
    }

    this.familiesRepository.merge(family, {
      ...updateFamilyDto,
      ...(updateFamilyDto.name !== undefined && {
        name: updateFamilyDto.name.trim(),
      }),
    });

    return this.familiesRepository.save(family);
  }

  async uploadFamilyCover(
    familyId: number,
    userId: number,
    file?: UploadedStorageFile,
  ) {
    const family = await this.findOneFamily(familyId);

    await this.permissionsService.assertFamilyEditor(userId, familyId);

    if (!file) {
      throw new BadRequestException('image is required');
    }

    const upload = await this.storageService.upload(file, {
      folder: `gia-pha/families/${family.id}/cover`,
      resourceType: 'image',
    });

    family.coverImageUrl = upload.secureUrl;
    family.coverImagePublicId = upload.publicId;

    return this.familiesRepository.save(family);
  }

  async removeFamily(id: number, userId: number) {
    await this.findOneFamily(id);

    await this.permissionsService.assertFamilyEditor(userId, id);

    const memberCount = await this.membersRepository.count({
      where: { familyId: id },
    });

    if (memberCount > 0) {
      throw new ConflictException(
        `Cannot delete family ${id} because it still has ${memberCount} member(s). Remove members first.`,
      );
    }

    await this.familiesRepository.delete(id);
    return { deleted: true, id };
  }

  async createMember(
    familyId: number,
    userId: number,
    createMemberDto: CreateMemberDto,
  ) {
    await this.ensureFamilyExists(familyId);
    await this.permissionsService.assertFamilyEditor(userId, familyId);

    if (!createMemberDto.fullName?.trim()) {
      throw new BadRequestException('Member fullName is required');
    }

    // Các member mới được thêm thủ công (người thân, người đã mất...)
    // thì userId sẽ bị null, hoàn toàn khớp với định nghĩa nghiệp vụ
    const member = this.membersRepository.create({
      ...this.normalizeMemberInput(createMemberDto),
      familyId,
      fullName: createMemberDto.fullName.trim(),
    });

    const savedMember = await this.membersRepository.save(member);

    // Ghi log hoạt động (nếu được tạo bởi một user cụ thể)
    if (userId) {
      await this.activityLogsService
        .log(
          familyId,
          userId,
          ActivityAction.ADD_MEMBER,
          'member',
          savedMember.id,
          savedMember.fullName,
        )
        .catch((err) => console.error('Failed to log activity:', err));
    }

    return savedMember;
  }

  async findMembersByFamily(familyId: number) {
    const family = await this.familiesRepository.findOne({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException(`Family ${familyId} not found`);
    }

    const members = await this.membersRepository.find({
      where: { familyId },
      order: { generation: 'ASC', id: 'ASC' },
    });

    const memberIds = members.map((member) => member.id);
    if (memberIds.length === 0) {
      return { family, members, parentChildRelations: [], marriages: [] };
    }

    const [parentChildRelations, marriages] = await Promise.all([
      this.parentChildRepository.find({
        where: [{ parentId: In(memberIds) }, { childId: In(memberIds) }],
        order: { id: 'ASC' },
      }),
      this.marriagesRepository.find({
        where: [{ memberAId: In(memberIds) }, { memberBId: In(memberIds) }],
        order: { id: 'ASC' },
      }),
    ]);

    return { family, members, parentChildRelations, marriages };
  }

  async findOneMember(id: number) {
    const member = await this.membersRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member ${id} not found`);
    }

    const [parentChildRelations, marriages] = await Promise.all([
      this.parentChildRepository.find({
        where: [{ parentId: id }, { childId: id }],
        relations: { parent: true, child: true },
        order: { id: 'ASC' },
      }),
      this.marriagesRepository.find({
        where: [{ memberAId: id }, { memberBId: id }],
        relations: { memberA: true, memberB: true },
        order: { id: 'ASC' },
      }),
    ]);

    return { member, parentChildRelations, marriages };
  }

  async findOneMemberInFamily(familyId: number, memberId: number) {
    const member = await this.membersRepository.findOne({
      where: { id: memberId, familyId },
    });

    if (!member) {
      throw new NotFoundException(
        `Member ${memberId} not found in family ${familyId}`,
      );
    }

    return this.findOneMember(member.id);
  }

  async updateMember(
    id: number,
    userId: number,
    updateMemberDto: UpdateMemberDto,
  ) {
    const member = await this.membersRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member ${id} not found`);
    }

    await this.permissionsService.assertFamilyEditor(userId, member.familyId!);

    if (updateMemberDto.familyId !== undefined) {
      await this.ensureFamilyExists(updateMemberDto.familyId);
    }

    if (
      updateMemberDto.fullName !== undefined &&
      !updateMemberDto.fullName.trim()
    ) {
      throw new BadRequestException('Member fullName cannot be empty');
    }

    this.membersRepository.merge(
      member,
      this.normalizeMemberInput(updateMemberDto),
    );
    const savedMember = await this.membersRepository.save(member);

    // Ghi log hoạt động
    if (userId) {
      await this.activityLogsService
        .log(
          member.familyId!,
          userId,
          ActivityAction.EDIT_MEMBER,
          'member',
          savedMember.id,
          savedMember.fullName,
        )
        .catch((err) => console.error('Failed to log activity:', err));
    }

    return savedMember;
  }

  async uploadMemberAvatar(
    memberId: number,
    userId: number,
    file?: UploadedStorageFile,
  ) {
    const member = await this.membersRepository.findOne({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    await this.permissionsService.assertFamilyEditor(userId, member.familyId!);

    if (!file) {
      throw new BadRequestException('image is required');
    }

    const upload = await this.storageService.upload(file, {
      folder: `gia-pha/families/${member.familyId}/members/${member.id}/avatar`,
      resourceType: 'image',
    });

    member.avatarUrl = upload.secureUrl;
    member.avatarPublicId = upload.publicId;

    return this.membersRepository.save(member);
  }

  async removeMember(id: number, userId: number) {
    const member = await this.membersRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member ${id} not found`);
    }

    await this.permissionsService.assertFamilyEditor(userId, member.familyId!);

    await this.membersRepository.remove(member);

    // Ghi log hoạt động
    if (userId) {
      await this.activityLogsService
        .log(
          member.familyId!,
          userId,
          ActivityAction.DELETE_MEMBER,
          'member',
          id,
          member.fullName,
        )
        .catch((err) => console.error('Failed to log activity:', err));
    }

    return { deleted: true, id };
  }

  async createParentChildRelation(
    dto: CreateParentChildRelationDto,
    userId: number,
  ) {
    if (dto.parentId === dto.childId) {
      throw new BadRequestException(
        'Parent and child must be different members',
      );
    }

    const [parent, child] = await Promise.all([
      this.ensureMemberExists(dto.parentId),
      this.ensureMemberExists(dto.childId),
    ]);

    this.ensureSameFamily(parent, child);

    await this.permissionsService.assertFamilyEditor(userId, parent.familyId!);

    const exists = await this.parentChildRepository.findOne({
      where: { parentId: dto.parentId, childId: dto.childId },
    });

    if (exists) {
      throw new ConflictException('Parent-child relation already exists');
    }

    const relation = this.parentChildRepository.create({
      parentId: dto.parentId,
      childId: dto.childId,
      relationType: dto.relationType?.trim() || 'parent',
    });

    return this.parentChildRepository.save(relation);
  }

  async createMarriage(dto: CreateMarriageDto, userId: number) {
    if (dto.memberAId === dto.memberBId) {
      throw new BadRequestException('Marriage members must be different');
    }

    const [memberA, memberB] = await Promise.all([
      this.ensureMemberExists(dto.memberAId),
      this.ensureMemberExists(dto.memberBId),
    ]);

    this.ensureSameFamily(memberA, memberB);

    await this.permissionsService.assertFamilyEditor(userId, memberA.familyId!);

    const exists = await this.marriagesRepository.findOne({
      where: [
        { memberAId: dto.memberAId, memberBId: dto.memberBId },
        { memberAId: dto.memberBId, memberBId: dto.memberAId },
      ],
    });

    if (exists) {
      throw new ConflictException('Marriage already exists');
    }

    const marriage = this.marriagesRepository.create({
      memberAId: dto.memberAId,
      memberBId: dto.memberBId,
      status: dto.status?.trim() || 'ACTIVE',
      marriedAt: this.normalizeDate(dto.marriedAt) ?? null,
      endedAt: this.normalizeDate(dto.endedAt) ?? null,
    });

    return this.marriagesRepository.save(marriage);
  }

  private async ensureFamilyExists(familyId: number) {
    const exists = await this.familiesRepository.exists({
      where: { id: familyId },
    });
    if (!exists) {
      throw new NotFoundException(`Family ${familyId} not found`);
    }
  }

  private async ensureMemberExists(id: number) {
    const member = await this.membersRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member ${id} not found`);
    }
    return member;
  }

  private ensureSameFamily(memberA: Member, memberB: Member) {
    if (memberA.familyId !== memberB.familyId) {
      throw new BadRequestException('Members must belong to the same family');
    }
  }

  private normalizeMemberInput(dto: CreateMemberDto | UpdateMemberDto) {
    const { dateOfBirth, dateOfDeath, ...rest } = dto;
    const data: Partial<Member> = { ...rest };

    const normalizedBirthDate = this.normalizeDate(dateOfBirth);
    if (normalizedBirthDate !== undefined) {
      data.dateOfBirth = normalizedBirthDate;
    }

    const normalizedDeathDate = this.normalizeDate(dateOfDeath);
    if (normalizedDeathDate !== undefined) {
      data.dateOfDeath = normalizedDeathDate;
    }

    if (typeof data.fullName === 'string') {
      data.fullName = data.fullName.trim();
    }

    return data;
  }

  private normalizeDate(value: string | Date | null | undefined) {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === '') {
      return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date value');
    }
    return date;
  }
}
