import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { Family } from '../../members/entities/family.entity';
import { User } from '../../users/entities/user.entity';

export enum MemberAttachmentRole {
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

@Entity('member_attachments')
@Unique(['familyId', 'userId'])
export class MemberAttachment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'memberId', nullable: true })
  memberId: number | null = null;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member!: Member;

  @Index()
  @Column({ name: 'familyId', nullable: true })
  familyId: number | null = null;

  @ManyToOne(() => Family, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  family!: Family;

  @Index()
  @Column({ name: 'userId' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: MemberAttachmentRole,
    default: MemberAttachmentRole.VIEWER,
  })
  role: MemberAttachmentRole = MemberAttachmentRole.VIEWER;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt!: Date;
}
