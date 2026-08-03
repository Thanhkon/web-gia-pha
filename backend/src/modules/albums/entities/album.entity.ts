import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Family } from '../../members/entities/family.entity';
import { User } from '../../users/entities/user.entity';
import { AlbumMedia } from './album-media.entity';

export const ALBUM_STATUSES = ['VISIBLE', 'HIDDEN'] as const;
export const ALBUM_VISIBILITIES = ['PUBLIC', 'INTERNAL'] as const;

export type AlbumStatus = (typeof ALBUM_STATUSES)[number];
export type AlbumVisibility = (typeof ALBUM_VISIBILITIES)[number];

@Entity('albums')
export class Album {
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

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'coverImage', type: 'text', nullable: true })
  coverImage: string | null;

  @Column({ name: 'coverImagePublicId', type: 'varchar', nullable: true })
  coverImagePublicId: string | null;

  @Column({ default: 'INTERNAL' })
  visibility: AlbumVisibility;

  @Column({ default: 'VISIBLE' })
  status: AlbumStatus;

  @Column({ name: 'notifiedAt', type: 'timestamp', nullable: true })
  notifiedAt: Date | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'deletedAt', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => AlbumMedia, (media) => media.album)
  media: AlbumMedia[];
}
