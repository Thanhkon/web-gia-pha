import { PartialType } from '@nestjs/mapped-types';
import { CreateAlbumMediaDto } from './create-album-media.dto';

export class UpdateAlbumMediaDto extends PartialType(CreateAlbumMediaDto) {}
