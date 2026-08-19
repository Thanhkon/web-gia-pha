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

export type EditRequestChange = {
  old: unknown;
  new: unknown;
};

export type EditRequestChanges = Record<string, EditRequestChange>;

@Entity('edit_requests')
export class EditRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'familyId' })
  familyId: number;

  @ManyToOne(() => Family, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @Column({ name: 'targetMemberId' })
  targetMemberId: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetMemberId' })
  targetMember: Member;

  @Column({ name: 'requestType', default: 'edit_member' })
  requestType: string;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'jsonb' })
  changes: EditRequestChanges;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'submittedByName' })
  submittedByName: string;

  @Column({ name: 'submittedByPhone', type: 'varchar', nullable: true })
  submittedByPhone: string | null;

  @Column({ name: 'submittedById', type: 'int', nullable: true })
  submittedById: number | null;

  @Column({ name: 'reviewedBy', type: 'varchar', nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'adminNote', type: 'text', nullable: true })
  adminNote: string | null;

  @Column({ name: 'reviewedAt', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;
}
