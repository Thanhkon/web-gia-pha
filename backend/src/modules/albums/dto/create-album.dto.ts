import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  ALBUM_STATUSES,
  ALBUM_VISIBILITIES,
} from '../entities/album.entity';
import type { AlbumStatus, AlbumVisibility } from '../entities/album.entity';

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  coverImage?: string | null;

  @IsString()
  @IsOptional()
  coverImagePublicId?: string | null;

  @IsIn([...ALBUM_VISIBILITIES])
  @IsOptional()
  visibility?: AlbumVisibility;

  @IsIn([...ALBUM_STATUSES])
  @IsOptional()
  status?: AlbumStatus;
}
