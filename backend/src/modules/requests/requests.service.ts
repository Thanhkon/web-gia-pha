import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Family } from '../members/entities/family.entity';
import { Member } from '../members/entities/member.entity';
import { CreateEditRequestDto } from './dto/create-edit-request.dto';
import { ReviewEditRequestDto } from './dto/review-edit-request.dto';
import {
  EditRequest,
  EditRequestChanges,
} from './entities/edit-request.entity';

const ALLOWED_MEMBER_CHANGE_FIELDS = new Set<keyof Member>([
  'fullName',
  'otherName',
  'gender',
  'generation',
  'role',
  'dateOfBirth',
  'dateOfDeath',
  'placeOfBirth',
  'currentAddress',
  'avatarUrl',
  'education',
  'occupation',
  'biography',
  'note',
]);

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(EditRequest)
    private readonly editRequestsRepository: Repository<EditRequest>,
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    private readonly dataSource: DataSource,
  ) {}

  async create(familyId: number, dto: CreateEditRequestDto) {
    await this.ensureFamilyExists(familyId);

    const member = await this.membersRepository.findOne({
      where: { id: dto.targetMemberId, familyId },
    });

    if (!member) {
      throw new NotFoundException(
        `Member ${dto.targetMemberId} not found in family ${familyId}`,
      );
    }

    this.validateCreatePayload(dto);

    const request = this.editRequestsRepository.create({
      familyId,
      targetMemberId: dto.targetMemberId,
      requestType: dto.requestType?.trim() || 'edit_member',
      changes: dto.changes,
      reason: dto.reason.trim(),
      submittedByName: dto.submittedByName.trim(),
      submittedByPhone: dto.submittedByPhone?.trim() || null,
    });

    return this.editRequestsRepository.save(request);
  }

  async findByFamily(familyId: number, status?: string) {
    await this.ensureFamilyExists(familyId);

    return this.editRequestsRepository.find({
      where: {
        familyId,
        ...(status ? { status: status.toUpperCase() } : {}),
      },
      relations: { targetMember: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const request = await this.editRequestsRepository.findOne({
      where: { id },
      relations: { family: true, targetMember: true },
    });

    if (!request) {
      throw new NotFoundException(`Edit request ${id} not found`);
    }

    return request;
  }

  async approve(id: number, dto: ReviewEditRequestDto) {
    return this.dataSource.transaction(async (manager) => {
      const requestsRepository = manager.getRepository(EditRequest);
      const membersRepository = manager.getRepository(Member);

      const request = await requestsRepository.findOne({ where: { id } });
      if (!request) {
        throw new NotFoundException(`Edit request ${id} not found`);
      }

      if (request.status !== 'PENDING') {
        throw new ConflictException('Only pending requests can be approved');
      }

      if (request.requestType !== 'edit_member') {
        throw new BadRequestException(
          `Unsupported requestType for approve: ${request.requestType}`,
        );
      }

      const member = await membersRepository.findOne({
        where: { id: request.targetMemberId, familyId: request.familyId },
      });

      if (!member) {
        throw new NotFoundException(
          `Member ${request.targetMemberId} not found in family ${request.familyId}`,
        );
      }

      this.applyChangesToMember(member, request.changes);
      await membersRepository.save(member);

      request.status = 'APPROVED';
      request.adminNote = dto.adminNote?.trim() || null;
      request.reviewedBy = dto.reviewedBy?.trim() || 'Admin';
      request.reviewedAt = new Date();

      return requestsRepository.save(request);
    });
  }

  async reject(id: number, dto: ReviewEditRequestDto) {
    const request = await this.editRequestsRepository.findOne({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Edit request ${id} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException('Only pending requests can be rejected');
    }

    request.status = 'REJECTED';
    request.adminNote = dto.adminNote?.trim() || null;
    request.reviewedBy = dto.reviewedBy?.trim() || 'Admin';
    request.reviewedAt = new Date();

    return this.editRequestsRepository.save(request);
  }

  async remove(id: number) {
    const request = await this.editRequestsRepository.findOne({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Edit request ${id} not found`);
    }

    await this.editRequestsRepository.remove(request);
    return { deleted: true, id };
  }

  private async ensureFamilyExists(familyId: number) {
    const exists = await this.familiesRepository.exists({
      where: { id: familyId },
    });
    if (!exists) {
      throw new NotFoundException(`Family ${familyId} not found`);
    }
  }

  private validateCreatePayload(dto: CreateEditRequestDto) {
    if (!dto.targetMemberId) {
      throw new BadRequestException('targetMemberId is required');
    }

    if (!dto.reason?.trim()) {
      throw new BadRequestException('reason is required');
    }

    if (!dto.submittedByName?.trim()) {
      throw new BadRequestException('submittedByName is required');
    }

    this.validateChanges(dto.changes);
  }

  private validateChanges(changes: EditRequestChanges) {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
      throw new BadRequestException('changes must be an object');
    }

    const entries = Object.entries(changes);
    if (entries.length === 0) {
      throw new BadRequestException('changes cannot be empty');
    }

    for (const [field, value] of entries) {
      if (!ALLOWED_MEMBER_CHANGE_FIELDS.has(field as keyof Member)) {
        throw new BadRequestException(`Field ${field} cannot be changed`);
      }

      if (!value || typeof value !== 'object' || !('new' in value)) {
        throw new BadRequestException(
          `Change ${field} must include a new value`,
        );
      }
    }
  }

  private applyChangesToMember(member: Member, changes: EditRequestChanges) {
    this.validateChanges(changes);

    for (const [field, value] of Object.entries(changes)) {
      const nextValue = this.normalizeMemberValue(field, value.new);
      (member as unknown as Record<string, unknown>)[field] = nextValue;
    }
  }

  private normalizeMemberValue(field: string, value: unknown) {
    if (field === 'dateOfBirth' || field === 'dateOfDeath') {
      if (value === null || value === '') {
        return null;
      }

      const date = value instanceof Date ? value : new Date(String(value));
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(`Invalid date for ${field}`);
      }

      return date;
    }

    if (field === 'generation') {
      if (value === null || value === '') {
        return null;
      }

      const generation = Number(value);
      if (!Number.isInteger(generation) || generation < 1) {
        throw new BadRequestException('generation must be a positive integer');
      }

      return generation;
    }

    if (field === 'fullName' && !String(value ?? '').trim()) {
      throw new BadRequestException('fullName cannot be empty');
    }

    return typeof value === 'string' ? value.trim() : value;
  }
}
