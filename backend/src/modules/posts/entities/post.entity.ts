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
import { User } from '../../users/entities/user.entity';

export const POST_STATUSES = [
  'DRAFT',
  'PENDING',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED',
] as const;

export const POST_VISIBILITIES = ['PUBLIC', 'FAMILY', 'ADMIN_ONLY'] as const;

export type PostStatus = (typeof POST_STATUSES)[number];
export type PostVisibility = (typeof POST_VISIBILITIES)[number];
export type PostContentBlockType = 'HEADING' | 'PARAGRAPH' | 'IMAGE';

export type PostContentBlock =
  | {
      id: string;
      type: 'HEADING';
      text: string;
    }
  | {
      id: string;
      type: 'PARAGRAPH';
      text: string;
    }
  | {
      id: string;
      type: 'IMAGE';
      imageUrl: string;
      publicId?: string | null;
      caption?: string | null;
    };

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'familyId' })
  familyId: number;

  @ManyToOne(() => Family, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @Column({ name: 'authorId' })
  authorId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  title: string;

  @Column({ type: 'varchar', nullable: true })
  slug: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'jsonb' })
  content: PostContentBlock[];

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ default: 'DRAFT' })
  status: PostStatus;

  @Column({ default: 'FAMILY' })
  visibility: PostVisibility;

  @Column({ name: 'thumbnailUrl', type: 'varchar', nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'thumbnailPublicId', type: 'varchar', nullable: true })
  thumbnailPublicId: string | null;

  @Column({ name: 'publishedAt', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'deletedAt', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
