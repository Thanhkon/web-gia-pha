import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityAction } from './entities/activity-log.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogsRepository: Repository<ActivityLog>,
    private readonly usersService: UsersService,
  ) {}

  async log(
    familyId: number,
    actorId: number,
    action: ActivityAction,
    targetType?: string,
    targetId?: number,
    targetName?: string,
    metadata?: Record<string, unknown>,
  ) {
    let actorName = 'System';
    if (actorId) {
      const user = await this.usersService.findById(actorId);
      actorName = user?.fullName || user?.username || 'Unknown User';
    }

    const activity = this.activityLogsRepository.create({
      familyId,
      actorId,
      actorName,
      action,
      targetType,
      targetId,
      targetName,
      metadata,
    });
    return this.activityLogsRepository.save(activity);
  }

  async findByFamily(
    familyId: number,
    options: {
      page?: number;
      limit?: number;
      action?: ActivityAction;
      fromDate?: string;
      toDate?: string;
    } = {},
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityLogsRepository
      .createQueryBuilder('log')
      .where('log.familyId = :familyId', { familyId })
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (options.action) {
      queryBuilder.andWhere('log.action = :action', { action: options.action });
    }

    if (options.fromDate) {
      queryBuilder.andWhere('log.createdAt >= :fromDate', {
        fromDate: new Date(options.fromDate),
      });
    }

    if (options.toDate) {
      const toDate = new Date(options.toDate);
      toDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('log.createdAt <= :toDate', { toDate });
    }

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
