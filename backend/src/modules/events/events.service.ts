import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Family } from '../members/entities/family.entity';
import { Member } from '../members/entities/member.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import {
  Event,
  EVENT_STATUSES,
  EVENT_VISIBILITIES,
  EventStatus,
  EventVisibility,
} from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
  ) {}

  async create(
    familyId: number,
    createdById: number,
    createEventDto: CreateEventDto,
  ) {
    await this.ensureFamilyExists(familyId);
    await this.ensureRelatedMemberBelongsToFamily(
      familyId,
      createEventDto.relatedMemberId,
    );
    this.validateCreatePayload(createEventDto);

    const startAt = this.normalizeRequiredDate(createEventDto.startAt, 'startAt');
    const endAt = this.normalizeDate(createEventDto.endAt) ?? null;
    this.validateDateRange(startAt, endAt);

    const event = this.eventsRepository.create({
      ...this.normalizeEventInput(createEventDto),
      familyId,
      createdById,
      relatedMemberId: createEventDto.relatedMemberId ?? null,
      eventType: this.normalizeEventType(createEventDto.eventType),
      status: this.normalizeStatus(createEventDto.status ?? 'UPCOMING'),
      visibility: this.normalizeVisibility(createEventDto.visibility ?? 'FAMILY'),
      startAt,
      endAt,
      isRecurring: createEventDto.isRecurring ?? false,
    });

    return this.eventsRepository.save(event);
  }

  async findByFamily(
    familyId: number,
    filters?: {
      status?: string;
      visibility?: string;
      eventType?: string;
      includeDeleted?: boolean;
    },
  ) {
    await this.ensureFamilyExists(familyId);

    return this.eventsRepository.find({
      where: {
        familyId,
        ...(filters?.status
          ? { status: this.normalizeStatus(filters.status) }
          : {}),
        ...(filters?.visibility
          ? { visibility: this.normalizeVisibility(filters.visibility) }
          : {}),
        ...(filters?.eventType
          ? { eventType: this.normalizeEventType(filters.eventType) }
          : {}),
        ...(filters?.includeDeleted ? {} : { deletedAt: IsNull() }),
      },
      relations: { createdBy: true, relatedMember: true },
      order: { startAt: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const event = await this.eventsRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { family: true, createdBy: true, relatedMember: true },
    });

    if (!event) {
      throw new NotFoundException(`Event ${id} not found`);
    }

    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    const event = await this.eventsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!event) {
      throw new NotFoundException(`Event ${id} not found`);
    }

    if (updateEventDto.relatedMemberId !== undefined) {
      await this.ensureRelatedMemberBelongsToFamily(
        event.familyId,
        updateEventDto.relatedMemberId,
      );
      event.relatedMemberId = updateEventDto.relatedMemberId ?? null;
    }

    this.eventsRepository.merge(event, this.normalizeEventInput(updateEventDto));

    if (updateEventDto.eventType !== undefined) {
      event.eventType = this.normalizeEventType(updateEventDto.eventType);
    }

    if (updateEventDto.status !== undefined) {
      event.status = this.normalizeStatus(updateEventDto.status);
    }

    if (updateEventDto.visibility !== undefined) {
      event.visibility = this.normalizeVisibility(updateEventDto.visibility);
    }

    if (updateEventDto.startAt !== undefined) {
      event.startAt = this.normalizeRequiredDate(updateEventDto.startAt, 'startAt');
    }

    if (updateEventDto.endAt !== undefined) {
      event.endAt = this.normalizeDate(updateEventDto.endAt) ?? null;
    }

    this.validateDateRange(event.startAt, event.endAt);

    return this.eventsRepository.save(event);
  }

  async remove(id: number) {
    const event = await this.eventsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!event) {
      throw new NotFoundException(`Event ${id} not found`);
    }

    event.deletedAt = new Date();
    await this.eventsRepository.save(event);

    return { deleted: true, id };
  }

  async restore(id: number) {
    const event = await this.eventsRepository.findOne({
      where: { id, deletedAt: Not(IsNull()) },
    });

    if (!event) {
      throw new NotFoundException(`Deleted event ${id} not found`);
    }

    event.deletedAt = null;
    return this.eventsRepository.save(event);
  }

  private async ensureFamilyExists(familyId: number) {
    const exists = await this.familiesRepository.exists({ where: { id: familyId } });
    if (!exists) {
      throw new NotFoundException(`Family ${familyId} not found`);
    }
  }

  private async ensureRelatedMemberBelongsToFamily(
    familyId: number,
    relatedMemberId?: number | null,
  ) {
    if (relatedMemberId === undefined || relatedMemberId === null) {
      return;
    }

    const exists = await this.membersRepository.exists({
      where: { id: relatedMemberId, familyId },
    });

    if (!exists) {
      throw new NotFoundException(
        `Related member ${relatedMemberId} not found in family ${familyId}`,
      );
    }
  }

  private validateCreatePayload(dto: CreateEventDto) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('title is required');
    }

    if (!dto.startAt) {
      throw new BadRequestException('startAt is required');
    }
  }

  private normalizeEventInput(dto: CreateEventDto | UpdateEventDto) {
    const {
      startAt,
      endAt,
      eventType,
      status,
      visibility,
      relatedMemberId,
      ...rest
    } = dto;
    const data: Partial<Event> = { ...rest };

    if (typeof data.title === 'string') {
      data.title = data.title.trim();
      if (!data.title) {
        throw new BadRequestException('title cannot be empty');
      }
    }

    return data;
  }

  private normalizeStatus(status: string): EventStatus {
    const normalizedStatus = status.trim().toUpperCase();
    if (!EVENT_STATUSES.includes(normalizedStatus as EventStatus)) {
      throw new BadRequestException(`Invalid event status: ${status}`);
    }

    return normalizedStatus as EventStatus;
  }

  private normalizeVisibility(visibility: string): EventVisibility {
    const normalizedVisibility = visibility.trim().toUpperCase();
    if (!EVENT_VISIBILITIES.includes(normalizedVisibility as EventVisibility)) {
      throw new BadRequestException(`Invalid event visibility: ${visibility}`);
    }

    return normalizedVisibility as EventVisibility;
  }

  private normalizeEventType(eventType?: string | null) {
    const normalizedEventType = eventType?.trim().toUpperCase() || 'OTHER';
    if (!normalizedEventType) {
      throw new BadRequestException('eventType cannot be empty');
    }

    return normalizedEventType;
  }

  private normalizeRequiredDate(value: string | Date, field: string) {
    const date = this.normalizeDate(value);
    if (!date) {
      throw new BadRequestException(`${field} is required`);
    }

    return date;
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

  private validateDateRange(startAt: Date, endAt: Date | null) {
    if (endAt && endAt.getTime() < startAt.getTime()) {
      throw new BadRequestException('endAt must be greater than or equal to startAt');
    }
  }
}
