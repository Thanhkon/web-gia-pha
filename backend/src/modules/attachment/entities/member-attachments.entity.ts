import {
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
import { User } from '../../users/entities/user.entity';
// TODO: sửa lại 2 đường dẫn import trên cho đúng vị trí thực tế trong project

export enum MemberAttachmentRole {
  EDITOR = 'editor', // được sửa thông tin member này
  VIEWER = 'viewer', // chỉ được xem
}

@Entity('member_attachments')
export class MemberAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  // 1 member chỉ được gán cho đúng 1 user quản lý -> unique
  @Column({ name: 'memberId', unique: true })
  memberId: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  // 1 user có thể quản lý nhiều member -> không unique
  @Index()
  @Column({ name: 'userId' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: MemberAttachmentRole,
    default: MemberAttachmentRole.VIEWER,
  })
  role: MemberAttachmentRole;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;
}
