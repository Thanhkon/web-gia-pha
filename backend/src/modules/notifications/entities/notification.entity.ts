import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export const NOTIFICATION_TYPES = [
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'JOIN_APPROVED',
  'JOIN_REJECTED',
  'NEW_POST',
  'NEW_EVENT',
  'NEW_EDIT_REQUEST',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'recipientId' })
  recipientId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({ type: 'varchar' })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'referenceId', type: 'int', nullable: true })
  referenceId: number | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;
}
