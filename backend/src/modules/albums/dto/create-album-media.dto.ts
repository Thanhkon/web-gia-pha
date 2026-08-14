import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MEDIA_TYPES } from '../entities/album-media.entity';
import type { MediaType } from '../entities/album-media.entity';

export class CreateAlbumMediaDto {
  @IsIn([...MEDIA_TYPES])
  @IsNotEmpty()
  type!: MediaType;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string | null;

  @IsString()
  @IsOptional()
  cloudinaryPublicId?: string | null;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsOptional()
  description?: string | null;
}
