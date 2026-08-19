import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { StorageService } from '../../common/storage/storage.service';
import { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { Family } from '../members/entities/family.entity';
import { Member } from '../members/entities/member.entity';
import { CreateHonorDto } from './dto/create-honor.dto';
import { UpdateHonorDto } from './dto/update-honor.dto';
import { Honor, HONOR_STATUSES, HonorStatus } from './entities/honor.entity';

@Injectable()
export class HonorsService {
  constructor(
    @InjectRepository(Honor)
    private readonly honorsRepository: Repository<Honor>,
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    private readonly storageService: StorageService,
  ) {}

  async create(
    familyId: number,
    createdById: number,
    createHonorDto: CreateHonorDto,
  ) {
    await this.ensureFamilyExists(familyId);
    await this.ensureMemberBelongsToFamily(familyId, createHonorDto.memberId);
    this.validateCreatePayload(createHonorDto);

    const startAt = this.normalizeDate(createHonorDto.startAt) ?? null;
    const endAt = this.normalizeDate(createHonorDto.endAt) ?? null;
    this.validateDateRange(startAt, endAt);

    const honor = this.honorsRepository.create({
      ...this.normalizeHonorInput(createHonorDto),
      familyId,
      createdById,
      memberId: createHonorDto.memberId,
      honorType: this.normalizeHonorType(createHonorDto.honorType),
      status: this.normalizeStatus(createHonorDto.status ?? 'ACTIVE'),
      awardedAt: this.normalizeDate(createHonorDto.awardedAt) ?? null,
      startAt,
      endAt,
      displayOrder: createHonorDto.displayOrder ?? 0,
    });

    return this.honorsRepository.save(honor);
  }

  async findByFamily(
    familyId: number,
    filters?: {
      memberId?: number;
      status?: string;
      honorType?: string;
      includeDeleted?: boolean;
    },
  ) {
    await this.ensureFamilyExists(familyId);

    return this.honorsRepository.find({
      where: {
        familyId,
        ...(filters?.memberId ? { memberId: filters.memberId } : {}),
        ...(filters?.status
          ? { status: this.normalizeStatus(filters.status) }
          : {}),
        ...(filters?.honorType
          ? { honorType: this.normalizeHonorType(filters.honorType) }
          : {}),
        ...(filters?.includeDeleted ? {} : { deletedAt: IsNull() }),
      },
      relations: { member: true, createdBy: true },
      order: { displayOrder: 'ASC', awardedAt: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const honor = await this.honorsRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { family: true, member: true, createdBy: true },
    });

    if (!honor) {
      throw new NotFoundException(`Honor ${id} not found`);
    }

    return honor;
  }

  async update(id: number, updateHonorDto: UpdateHonorDto) {
    const honor = await this.honorsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!honor) {
      throw new NotFoundException(`Honor ${id} not found`);
    }

    if (updateHonorDto.memberId !== undefined) {
      await this.ensureMemberBelongsToFamily(
        honor.familyId,
        updateHonorDto.memberId,
      );
      honor.memberId = updateHonorDto.memberId;
    }

    this.honorsRepository.merge(
      honor,
      this.normalizeHonorInput(updateHonorDto),
    );

    if (updateHonorDto.honorType !== undefined) {
      honor.honorType = this.normalizeHonorType(updateHonorDto.honorType);
    }

    if (updateHonorDto.status !== undefined) {
      honor.status = this.normalizeStatus(updateHonorDto.status);
    }

    if (updateHonorDto.awardedAt !== undefined) {
      honor.awardedAt = this.normalizeDate(updateHonorDto.awardedAt) ?? null;
    }

    if (updateHonorDto.startAt !== undefined) {
      honor.startAt = this.normalizeDate(updateHonorDto.startAt) ?? null;
    }

    if (updateHonorDto.endAt !== undefined) {
      honor.endAt = this.normalizeDate(updateHonorDto.endAt) ?? null;
    }

    if (updateHonorDto.displayOrder !== undefined) {
      honor.displayOrder = this.normalizeDisplayOrder(
        updateHonorDto.displayOrder,
      );
    }

    this.validateDateRange(honor.startAt, honor.endAt);

    return this.honorsRepository.save(honor);
  }

  async uploadImage(honorId: number, file?: UploadedStorageFile) {
    const honor = await this.honorsRepository.findOne({
      where: { id: honorId, deletedAt: IsNull() },
    });

    if (!honor) {
      throw new NotFoundException(`Honor ${honorId} not found`);
    }

    if (!file) {
      throw new BadRequestException('image is required');
    }

    const upload = await this.storageService.upload(file, {
      folder: `gia-pha/families/${honor.familyId}/honors/${honor.id}`,
      resourceType: 'image',
    });

    honor.imageUrl = upload.secureUrl;
    honor.imagePublicId = upload.publicId;

    return this.honorsRepository.save(honor);
  }

  async remove(id: number) {
    const honor = await this.honorsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!honor) {
      throw new NotFoundException(`Honor ${id} not found`);
    }

    honor.deletedAt = new Date();
    await this.honorsRepository.save(honor);

    return { deleted: true, id };
  }

  async restore(id: number) {
    const honor = await this.honorsRepository.findOne({
      where: { id, deletedAt: Not(IsNull()) },
    });

    if (!honor) {
      throw new NotFoundException(`Deleted honor ${id} not found`);
    }

    honor.deletedAt = null;
    return this.honorsRepository.save(honor);
  }

  private async ensureFamilyExists(familyId: number) {
    const exists = await this.familiesRepository.exists({
      where: { id: familyId },
    });
    if (!exists) {
      throw new NotFoundException(`Family ${familyId} not found`);
    }
  }

  private async ensureMemberBelongsToFamily(
    familyId: number,
    memberId: number,
  ) {
    if (!memberId) {
      throw new BadRequestException('memberId is required');
    }

    const exists = await this.membersRepository.exists({
      where: { id: memberId, familyId },
    });

    if (!exists) {
      throw new NotFoundException(
        `Member ${memberId} not found in family ${familyId}`,
      );
    }
  }

  private validateCreatePayload(dto: CreateHonorDto) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('title is required');
    }
  }

  private normalizeHonorInput(dto: CreateHonorDto | UpdateHonorDto) {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      awardedAt,
      startAt,
      endAt,
      honorType,
      status,
      memberId,
      displayOrder,
      ...rest
    } = dto;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    const data: Partial<Honor> = { ...rest };

    if (typeof data.title === 'string') {
      data.title = data.title.trim();
      if (!data.title) {
        throw new BadRequestException('title cannot be empty');
      }
    }

    return data;
  }

  private normalizeStatus(status: string): HonorStatus {
    const normalizedStatus = status.trim().toUpperCase();
    if (!HONOR_STATUSES.includes(normalizedStatus as HonorStatus)) {
      throw new BadRequestException(`Invalid honor status: ${status}`);
    }

    return normalizedStatus as HonorStatus;
  }

  private normalizeHonorType(honorType?: string | null) {
    return honorType?.trim().toUpperCase() || 'OTHER';
  }

  private normalizeDisplayOrder(displayOrder: number) {
    const normalizedDisplayOrder = Number(displayOrder);
    if (!Number.isInteger(normalizedDisplayOrder)) {
      throw new BadRequestException('displayOrder must be an integer');
    }

    return normalizedDisplayOrder;
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

  private validateDateRange(startAt: Date | null, endAt: Date | null) {
    if (startAt && endAt && endAt.getTime() < startAt.getTime()) {
      throw new BadRequestException(
        'endAt must be greater than or equal to startAt',
      );
    }
  }
}
