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

@Entity('join_requests')
export class JoinRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'familyId' })
  familyId: number;

  @ManyToOne(() => Family, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @Column({ name: 'userId' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'targetMemberId' })
  targetMemberId: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetMemberId' })
  targetMember: Member;

  @Column({ default: 'PENDING' })
  status: string; // PENDING, APPROVED, REJECTED

  @Column({ type: 'text', nullable: true })
  note: string | null;

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
