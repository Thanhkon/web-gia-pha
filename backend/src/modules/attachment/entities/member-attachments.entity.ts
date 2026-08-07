import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { Family } from '../../members/entities/family.entity';
import { User } from '../../users/entities/user.entity';
// TODO: sửa lại đường dẫn import ở trên cho đúng vị trí thực tế trong project

export enum MemberAttachmentRole {
  EDITOR = 'editor', // được sửa thông tin member này / gia đình này
  VIEWER = 'viewer', // chỉ được xem
}

@Entity('member_attachments')
@Check(
  `("memberId" IS NOT NULL AND "familyId" IS NULL) OR ("memberId" IS NULL AND "familyId" IS NOT NULL)`,
)
export class MemberAttachment {
  @PrimaryGeneratedColumn()
  id!: number;

  // 1 member chỉ được gán cho đúng 1 user quản lý -> unique
  // null khi đây là attachment cấp family (xem familyId bên dưới)
  @Column({ name: 'memberId', unique: true, nullable: true })
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

  // 1 user có thể quản lý nhiều member -> không unique
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
