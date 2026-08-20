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

export const HONOR_STATUSES = ['ACTIVE', 'HIDDEN', 'ARCHIVED'] as const;
export type HonorStatus = (typeof HONOR_STATUSES)[number];

@Entity('honors')
export class Honor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'familyId' })
  familyId: number;

  @ManyToOne(() => Family, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @Column({ name: 'memberId' })
  memberId: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column({ name: 'createdById' })
  createdById: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  title: string;

  @Column({ name: 'honorType', default: 'OTHER' })
  honorType: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  achievement: string | null;

  @Column({ name: 'imageUrl', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'imagePublicId', type: 'varchar', nullable: true })
  imagePublicId: string | null;

  @Column({ name: 'documentUrl', type: 'varchar', nullable: true })
  documentUrl: string | null;

  @Column({ name: 'awardedAt', type: 'timestamp', nullable: true })
  awardedAt: Date | null;

  @Column({ name: 'startAt', type: 'timestamp', nullable: true })
  startAt: Date | null;

  @Column({ name: 'endAt', type: 'timestamp', nullable: true })
  endAt: Date | null;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: HonorStatus;

  @Column({ name: 'displayOrder', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'deletedAt', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
