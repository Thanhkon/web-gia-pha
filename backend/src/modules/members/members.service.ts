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
  ) {}

  async findAllFamilies() {
    return this.familiesRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async createFamily(createFamilyDto: CreateFamilyDto, userId: number) {
    if (!createFamilyDto.name?.trim()) {
      throw new BadRequestException('Family name is required');
    }

    try {
      const family = this.familiesRepository.create({
        name: createFamilyDto.name.trim(),
        originPlace: createFamilyDto.originPlace?.trim() || null,
        description: createFamilyDto.description?.trim() || null,
        coverImageUrl: createFamilyDto.coverImageUrl || null,
      });

      const savedFamily = await this.familiesRepository.save(family);

      // Gán quyền editor cấp family
      try {
        await this.memberAttachmentsService.createFamilyEditor(
          savedFamily.id,
          userId,
        );
      } catch (editorError) {
        console.warn(
          `Could not assign family editor for userId ${userId}:`,
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

    const member = this.membersRepository.create({
      ...this.normalizeMemberInput(createMemberDto),
      familyId,
      fullName: createMemberDto.fullName.trim(),
    });

    return this.membersRepository.save(member);
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
    return this.membersRepository.save(member);
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
