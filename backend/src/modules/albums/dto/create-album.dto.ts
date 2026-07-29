import { AlbumStatus, AlbumVisibility } from '../entities/album.entity';

export class CreateAlbumDto {
  title: string;
  description?: string | null;
  coverImage?: string | null;
  visibility?: AlbumVisibility;
  status?: AlbumStatus;
}
