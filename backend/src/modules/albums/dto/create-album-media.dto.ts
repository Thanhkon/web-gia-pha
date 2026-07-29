import { MediaType } from '../entities/album-media.entity';

export class CreateAlbumMediaDto {
  type: MediaType;
  url: string;
  thumbnailUrl?: string | null;
  fileName: string;
  description?: string | null;
}
