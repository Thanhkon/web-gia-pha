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
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { ReviewJoinRequestDto } from './dto/review-join-request.dto';
import {
  EditRequest,
  EditRequestChanges,
} from './entities/edit-request.entity';
import { JoinRequest } from './entities/join-request.entity';
import { MemberAttachmentsService } from '../attachment/member-attachments.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityAction } from '../activity-logs/entities/activity-log.entity';

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
    @InjectRepository(JoinRequest)
    private readonly joinRequestsRepository: Repository<JoinRequest>,
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    private readonly dataSource: DataSource,
    private readonly memberAttachmentsService: MemberAttachmentsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(
    familyId: number,
    dto: CreateEditRequestDto,
    submittedById?: number,
  ) {
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
      submittedById: submittedById || null,
    });

    await this.editRequestsRepository.save(request);

    await this.notificationsService.createForFamily(
      familyId,
      'NEW_EDIT_REQUEST',
      'Yêu cầu chỉnh sửa mới',
      `Có yêu cầu chỉnh sửa thông tin từ ${request.submittedByName}.`,
      request.id,
    );

    return request;
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

  async approve(id: number, reviewerId: number, dto: ReviewEditRequestDto) {
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
      request.reviewedBy = reviewerId.toString();
      request.reviewedAt = new Date();

      const savedRequest = await requestsRepository.save(request);

      await this.activityLogsService
        .log(
          request.familyId,
          reviewerId,
          ActivityAction.APPROVE_REQUEST,
          'edit_request',
          savedRequest.id,
          member.fullName,
        )
        .catch((err) => console.error('Failed to log activity:', err));

      if (request.submittedById) {
        await this.notificationsService.createForUser(
          request.submittedById,
          'REQUEST_APPROVED',
          'Yêu cầu chỉnh sửa đã được duyệt',
          `Yêu cầu chỉnh sửa thông tin của ${member.fullName} đã được quản trị viên chấp thuận.`,
          savedRequest.id,
        );
      }

      return savedRequest;
    });
  }

  async reject(id: number, reviewerId: number, dto: ReviewEditRequestDto) {
    const request = await this.editRequestsRepository.findOne({
      where: { id },
      relations: { targetMember: true },
    });
    if (!request) {
      throw new NotFoundException(`Edit request ${id} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException('Only pending requests can be rejected');
    }

    request.status = 'REJECTED';
    request.adminNote = dto.adminNote?.trim() || null;
    request.reviewedBy = reviewerId.toString();
    request.reviewedAt = new Date();

    const savedRequest = await this.editRequestsRepository.save(request);

    await this.activityLogsService
      .log(
        request.familyId,
        reviewerId,
        ActivityAction.REJECT_REQUEST,
        'edit_request',
        savedRequest.id,
        request.targetMember?.fullName || 'Member',
      )
      .catch((err) => console.error('Failed to log activity:', err));

    if (request.submittedById) {
      await this.notificationsService.createForUser(
        request.submittedById,
        'REQUEST_REJECTED',
        'Yêu cầu chỉnh sửa bị từ chối',
        `Yêu cầu chỉnh sửa thông tin của ${request.targetMember?.fullName || 'Member'} đã bị từ chối.`,
        savedRequest.id,
      );
    }

    return savedRequest;
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

      const date =
        value instanceof Date ? value : new Date(value as string | number);
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

    if (field === 'fullName' && (typeof value !== 'string' || !value.trim())) {
      throw new BadRequestException('fullName cannot be empty');
    }

    return typeof value === 'string' ? value.trim() : value;
  }

  // --- JOIN REQUESTS METHODS ---

  async createJoinRequest(userId: number, dto: CreateJoinRequestDto) {
    await this.ensureFamilyExists(dto.familyId);

    const member = await this.membersRepository.findOne({
      where: { id: dto.targetMemberId, familyId: dto.familyId },
    });

    if (!member) {
      throw new NotFoundException(
        `Member ${dto.targetMemberId} not found in family ${dto.familyId}`,
      );
    }

    const existingRequest = await this.joinRequestsRepository.findOne({
      where: { userId, familyId: dto.familyId, status: 'PENDING' },
    });

    if (existingRequest) {
      throw new ConflictException(
        'You already have a pending join request for this family',
      );
    }

    const request = this.joinRequestsRepository.create({
      familyId: dto.familyId,
      userId,
      targetMemberId: dto.targetMemberId,
      note: dto.note?.trim() || null,
    });

    return this.joinRequestsRepository.save(request);
  }

  async findJoinRequestsByFamily(familyId: number, status?: string) {
    await this.ensureFamilyExists(familyId);

    return this.joinRequestsRepository.find({
      where: {
        familyId,
        ...(status ? { status: status.toUpperCase() } : {}),
      },
      relations: { user: true, targetMember: true },
      order: { createdAt: 'DESC' },
    });
  }

  async approveJoinRequest(
    id: number,
    reviewerId: number,
    dto: ReviewJoinRequestDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const joinRepo = manager.getRepository(JoinRequest);
      const memberRepo = manager.getRepository(Member);

      const request = await joinRepo.findOne({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException(`Join request ${id} not found`);
      }

      if (request.status !== 'PENDING') {
        throw new ConflictException('Only pending requests can be approved');
      }

      // Automatically assign the user to the member node with appropriate role
      if (dto.role === 'editor') {
        await this.memberAttachmentsService.createFamilyEditor(
          request.familyId,
          request.userId,
          request.targetMemberId,
        );
      } else {
        await this.memberAttachmentsService.createFamilyViewer(
          request.familyId,
          request.userId,
          request.targetMemberId,
        );
      }

      // Sync Member info to User info if User fields are empty
      try {
        const user = await this.usersService.findById(request.userId);
        const member = await memberRepo.findOne({
          where: { id: request.targetMemberId },
        });

        if (user && member) {
          const updatePayload: Partial<
            import('../users/dto/update-user.dto').UpdateUserDto
          > = {};
          if (!user.fullName && member.fullName) {
            updatePayload.fullName = member.fullName;
          }
          if (!user.dateOfBirth && member.dateOfBirth) {
            updatePayload.dateOfBirth = member.dateOfBirth
              .toISOString()
              .split('T')[0];
          }
          if (!user.address && member.currentAddress) {
            updatePayload.address = member.currentAddress;
          }
          if (Object.keys(updatePayload).length > 0) {
            await this.usersService.update(user.id, updatePayload);
          }
        }
      } catch (e) {
        console.error('Error syncing user info:', e);
      }

      request.status = 'APPROVED';
      request.adminNote = dto.adminNote?.trim() || null;
      request.reviewedBy = reviewerId.toString();
      request.reviewedAt = new Date();

      await joinRepo.save(request);

      await this.notificationsService.createForUser(
        request.userId,
        'JOIN_APPROVED',
        'Yêu cầu tham gia đã được duyệt',
        `Yêu cầu tham gia gia phả của bạn đã được quản trị viên chấp thuận.`,
        request.id,
      );

      return request;
    });
  }

  async rejectJoinRequest(
    id: number,
    reviewerId: number,
    dto: ReviewJoinRequestDto,
  ) {
    const request = await this.joinRequestsRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Join request ${id} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException('Only pending requests can be rejected');
    }

    request.status = 'REJECTED';
    request.adminNote = dto.adminNote?.trim() || null;
    request.reviewedBy = reviewerId.toString();
    request.reviewedAt = new Date();

    await this.joinRequestsRepository.save(request);

    await this.notificationsService.createForUser(
      request.userId,
      'JOIN_REJECTED',
      'Yêu cầu tham gia bị từ chối',
      `Yêu cầu tham gia gia phả của bạn đã bị từ chối.`,
      request.id,
    );

    return request;
  }
}
