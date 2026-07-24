import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Album } from './album.entity';

export const MEDIA_TYPES = ['IMAGE', 'VIDEO'] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

@Entity('album_media')
export class AlbumMedia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'albumId' })
  albumId: number;

  @ManyToOne(() => Album, (album) => album.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'albumId' })
  album: Album;

  @Column()
  type: MediaType;

  @Column({ type: 'text' })
  url: string;

  @Column({ name: 'thumbnailUrl', type: 'text', nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'fileName' })
  fileName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'uploadedById' })
  uploadedById: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column({ name: 'uploadedAt', type: 'timestamp' })
  uploadedAt: Date;

  @Column({ name: 'deletedAt', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}