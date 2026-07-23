import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Family } from '../../members/entities/family.entity';
import { Member } from '../../members/entities/member.entity';
import { User } from '../../users/entities/user.entity';

export const EVENT_STATUSES = [
  'UPCOMING',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
] as const;

export const EVENT_VISIBILITIES = ['PUBLIC', 'FAMILY', 'ADMIN_ONLY'] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];
export type EventVisibility = (typeof EVENT_VISIBILITIES)[number];

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'familyId' })
  familyId: number;

  @ManyToOne(() => Family, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @Column({ name: 'createdById' })
  createdById: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ name: 'relatedMemberId', type: 'int', nullable: true })
  relatedMemberId: number | null;

  @ManyToOne(() => Member, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'relatedMemberId' })
  relatedMember: Member | null;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'eventType', default: 'OTHER' })
  eventType: string;

  @Column({ default: 'UPCOMING' })
  status: EventStatus;

  @Column({ default: 'FAMILY' })
  visibility: EventVisibility;

  @Column({ name: 'startAt', type: 'timestamp' })
  startAt: Date;

  @Column({ name: 'endAt', type: 'timestamp', nullable: true })
  endAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ name: 'coverImageUrl', type: 'varchar', nullable: true })
  coverImageUrl: string | null;

  @Column({ name: 'isRecurring', default: false })
  isRecurring: boolean;

  @Column({ name: 'recurrenceRule', type: 'varchar', nullable: true })
  recurrenceRule: string | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'deletedAt', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
