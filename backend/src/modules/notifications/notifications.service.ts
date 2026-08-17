import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { Family } from '../members/entities/family.entity';
import { MemberAttachment } from '../attachment/entities/member-attachments.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
    @InjectRepository(MemberAttachment)
    private readonly memberAttachmentsRepository: Repository<MemberAttachment>,
  ) {}

  async createForUser(
    userId: number,
    type: NotificationType,
    title: string,
    content: string,
    referenceId?: number,
  ) {
    const notification = this.notificationsRepository.create({
      recipientId: userId,
      type,
      title,
      content,
      referenceId,
    });
    return this.notificationsRepository.save(notification);
  }

  async createForFamily(
    familyId: number,
    type: NotificationType,
    title: string,
    content: string,
    referenceId?: number,
  ) {
    const attachments = await this.memberAttachmentsRepository.find({
      where: { familyId },
    });

    const usersToNotify = attachments.map((a) => a.userId);

    console.log(
      `[createForFamily] Family ${familyId} has ${attachments.length} attachments. Users to notify:`,
      usersToNotify,
    );

    // Loại bỏ trùng lặp nếu 1 user có nhiều quyền trong cùng gia đình
    const uniqueUserIds = [...new Set(usersToNotify)];

    const notifications = uniqueUserIds.map((userId) =>
      this.notificationsRepository.create({
        recipientId: userId,
        type,
        title,
        content,
        referenceId,
      }),
    );

    if (notifications.length > 0) {
      await this.notificationsRepository.save(notifications);
      console.log(
        `[createForFamily] Saved ${notifications.length} notifications`,
      );
    } else {
      console.log(`[createForFamily] No users to notify`);
    }
  }

  async findAll(userId: number) {
    return this.notificationsRepository.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: 20, // Chỉ lấy 20 thông báo gần nhất
    });
  }

  async countUnread(userId: number) {
    const count = await this.notificationsRepository.count({
      where: { recipientId: userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: number, userId: number) {
    await this.notificationsRepository.update(
      { id, recipientId: userId },
      { isRead: true },
    );
    return { success: true };
  }

  async markAllAsRead(userId: number) {
    await this.notificationsRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }
}
