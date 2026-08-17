import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Family } from '../../members/entities/family.entity';
import { User } from '../../users/entities/user.entity';

export enum ActivityAction {
  ADD_MEMBER = 'ADD_MEMBER',
  EDIT_MEMBER = 'EDIT_MEMBER',
  DELETE_MEMBER = 'DELETE_MEMBER',
  APPROVE_REQUEST = 'APPROVE_REQUEST',
  REJECT_REQUEST = 'REJECT_REQUEST',
  CREATE_POST = 'CREATE_POST',
  EDIT_POST = 'EDIT_POST',
  DELETE_POST = 'DELETE_POST',
  CREATE_EVENT = 'CREATE_EVENT',
  EDIT_EVENT = 'EDIT_EVENT',
  DELETE_EVENT = 'DELETE_EVENT',
  JOIN_FAMILY = 'JOIN_FAMILY',
  UPLOAD_PHOTO = 'UPLOAD_PHOTO',
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'familyId' })
  familyId!: number;

  @ManyToOne(() => Family, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  family!: Family;

  @Column({ name: 'actorId' })
  actorId!: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor?: User | null;

  @Column({ name: 'actorName' })
  actorName!: string;

  @Column({
    type: 'enum',
    enum: ActivityAction,
  })
  action!: ActivityAction;

  @Column({ name: 'targetType', nullable: true })
  targetType?: string; // 'member', 'post', 'event', 'request', v.v.

  @Column({ name: 'targetId', type: 'int', nullable: true })
  targetId?: number | null;

  @Column({ name: 'targetName', nullable: true })
  targetName?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt!: Date;
}
