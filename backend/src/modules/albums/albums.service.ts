import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { StorageService } from '../../common/storage/storage.service';
import { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { PermissionsService } from '../permissions/permissions.service';
import { Family } from '../members/entities/family.entity';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { CreateAlbumMediaDto } from './dto/create-album-media.dto';
import { UpdateAlbumMediaDto } from './dto/update-album-media.dto';
import {
  Album,
  ALBUM_STATUSES,
  ALBUM_VISIBILITIES,
  AlbumStatus,
  AlbumVisibility,
} from './entities/album.entity';
import {
  AlbumMedia,
  MEDIA_TYPES,
  MediaType,
} from './entities/album-media.entity';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private readonly albumsRepository: Repository<Album>,
    @InjectRepository(AlbumMedia)
    private readonly albumMediaRepository: Repository<AlbumMedia>,
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
    private readonly storageService: StorageService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(
    familyId: number,
    createdById: number,
    createAlbumDto: CreateAlbumDto,
  ) {
    await this.ensureFamilyExists(familyId);
    await this.permissionsService.assertFamilyEditor(createdById, familyId);
    this.validateCreatePayload(createAlbumDto);

    const album = this.albumsRepository.create({
      ...this.normalizeAlbumInput(createAlbumDto),
      familyId,
      createdById,
      visibility: this.normalizeVisibility(
        createAlbumDto.visibility ?? 'INTERNAL',
      ),
      status: this.normalizeStatus(createAlbumDto.status ?? 'VISIBLE'),
    });

    return this.albumsRepository.save(album);
  }

  async findByFamily(
    familyId: number,
    filters?: {
      status?: string;
      visibility?: string;
      includeDeleted?: boolean;
    },
  ) {
    // GET - không cần check quyền editor, ai login cũng xem được
    await this.ensureFamilyExists(familyId);

    return this.albumsRepository.find({
      where: {
        familyId,
        ...(filters?.status
          ? { status: this.normalizeStatus(filters.status) }
          : {}),
        ...(filters?.visibility
          ? { visibility: this.normalizeVisibility(filters.visibility) }
          : {}),
        ...(filters?.includeDeleted ? {} : { deletedAt: IsNull() }),
      },
      relations: { createdBy: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, options?: { includeDeletedMedia?: boolean }) {
    // GET - không cần check quyền editor
    const album = await this.albumsRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { family: true, createdBy: true, media: true },
    });

    if (!album) {
      throw new NotFoundException(`Album ${id} not found`);
    }

    if (!options?.includeDeletedMedia && album.media) {
      album.media = album.media.filter((m) => !m.deletedAt);
    }

    return album;
  }

  async update(id: number, userId: number, updateAlbumDto: UpdateAlbumDto) {
    const album = await this.albumsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!album) {
      throw new NotFoundException(`Album ${id} not found`);
    }

    await this.permissionsService.assertFamilyEditor(userId, album.familyId);

    this.albumsRepository.merge(
      album,
      this.normalizeAlbumInput(updateAlbumDto),
    );

    if (updateAlbumDto.status !== undefined) {
      album.status = this.normalizeStatus(updateAlbumDto.status);
    }

    if (updateAlbumDto.visibility !== undefined) {
      album.visibility = this.normalizeVisibility(updateAlbumDto.visibility);
    }

    return this.albumsRepository.save(album);
  }

  async uploadCoverImage(
    albumId: number,
    userId: number,
    file?: UploadedStorageFile,
  ) {
    const album = await this.albumsRepository.findOne({
      where: { id: albumId, deletedAt: IsNull() },
    });

    if (!album) {
      throw new NotFoundException(`Album ${albumId} not found`);
    }

    await this.permissionsService.assertFamilyEditor(userId, album.familyId);

    if (!file) {
      throw new BadRequestException('image is required');
    }

    const upload = await this.storageService.upload(file, {
      folder: `gia-pha/families/${album.familyId}/albums/${album.id}/cover`,
      resourceType: 'image',
    });

    album.coverImage = upload.secureUrl;
    album.coverImagePublicId = upload.publicId;

    return this.albumsRepository.save(album);
  }

  async remove(id: number, userId: number) {
    const album = await this.albumsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!album) {
      throw new NotFoundException(`Album ${id} not found`);
    }

    await this.permissionsService.assertFamilyEditor(userId, album.familyId);

    album.deletedAt = new Date();
    await this.albumsRepository.save(album);

    return { deleted: true, id };
  }

  async restore(id: number, userId: number) {
    const album = await this.albumsRepository.findOne({
      where: { id, deletedAt: Not(IsNull()) },
    });

    if (!album) {
      throw new NotFoundException(`Deleted album ${id} not found`);
    }

    await this.permissionsService.assertFamilyEditor(userId, album.familyId);

    album.deletedAt = null;
    return this.albumsRepository.save(album);
  }

  async addMedia(
    albumId: number,
    uploadedById: number,
    createAlbumMediaDto: CreateAlbumMediaDto,
  ) {
    const album = await this.ensureAlbumExists(albumId);
    await this.permissionsService.assertFamilyEditor(
      uploadedById,
      album.familyId,
    );
    this.validateMediaPayload(createAlbumMediaDto);

    const media = this.albumMediaRepository.create({
      ...createAlbumMediaDto,
      thumbnailUrl: createAlbumMediaDto.thumbnailUrl ?? null,
      description: createAlbumMediaDto.description ?? null,
      albumId,
      uploadedById,
      type: this.normalizeMediaType(createAlbumMediaDto.type),
      uploadedAt: new Date(),
    });

    return this.albumMediaRepository.save(media);
  }

  async uploadMedia(
    albumId: number,
    uploadedById: number,
    file?: UploadedStorageFile,
    description?: string | null,
  ) {
    const album = await this.albumsRepository.findOne({
      where: { id: albumId, deletedAt: IsNull() },
    });

    if (!album) {
      throw new NotFoundException(`Album ${albumId} not found`);
    }

    await this.permissionsService.assertFamilyEditor(
      uploadedById,
      album.familyId,
    );

    if (!file) {
      throw new BadRequestException('file is required');
    }

    const upload = await this.storageService.upload(file, {
      folder: `gia-pha/families/${album.familyId}/albums/${album.id}/media`,
      resourceType: 'auto',
    });
    const type: MediaType = upload.resourceType === 'video' ? 'VIDEO' : 'IMAGE';

    const media = this.albumMediaRepository.create({
      albumId,
      uploadedById,
      type,
      url: upload.secureUrl,
      thumbnailUrl: upload.thumbnailUrl ?? null,
      cloudinaryPublicId: upload.publicId,
      fileName: file.originalname,
      description: description?.trim() || null,
      uploadedAt: new Date(),
    });

    return this.albumMediaRepository.save(media);
  }

  async updateMedia(
    albumId: number,
    mediaId: number,
    userId: number,
    updateAlbumMediaDto: UpdateAlbumMediaDto,
  ) {
    const album = await this.ensureAlbumExists(albumId);
    await this.permissionsService.assertFamilyEditor(userId, album.familyId);

    const media = await this.albumMediaRepository.findOne({
      where: { id: mediaId, albumId, deletedAt: IsNull() },
    });

    if (!media) {
      throw new NotFoundException(
        `Media ${mediaId} not found in album ${albumId}`,
      );
    }

    this.albumMediaRepository.merge(media, updateAlbumMediaDto);

    if (updateAlbumMediaDto.type !== undefined) {
      media.type = this.normalizeMediaType(updateAlbumMediaDto.type);
    }

    return this.albumMediaRepository.save(media);
  }

  async removeMedia(albumId: number, mediaId: number, userId: number) {
    const album = await this.ensureAlbumExists(albumId);
    await this.permissionsService.assertFamilyEditor(userId, album.familyId);

    const media = await this.albumMediaRepository.findOne({
      where: { id: mediaId, albumId, deletedAt: IsNull() },
    });

    if (!media) {
      throw new NotFoundException(
        `Media ${mediaId} not found in album ${albumId}`,
      );
    }

    media.deletedAt = new Date();
    await this.albumMediaRepository.save(media);

    return { deleted: true, id: mediaId };
  }

  async restoreMedia(albumId: number, mediaId: number, userId: number) {
    const album = await this.ensureAlbumExists(albumId);
    await this.permissionsService.assertFamilyEditor(userId, album.familyId);

    const media = await this.albumMediaRepository.findOne({
      where: { id: mediaId, albumId, deletedAt: Not(IsNull()) },
    });

    if (!media) {
      throw new NotFoundException(
        `Deleted media ${mediaId} not found in album ${albumId}`,
      );
    }

    media.deletedAt = null;
    return this.albumMediaRepository.save(media);
  }

  private async ensureFamilyExists(familyId: number) {
    const exists = await this.familiesRepository.exists({
      where: { id: familyId },
    });
    if (!exists) {
      throw new NotFoundException(`Family ${familyId} not found`);
    }
  }

  private async ensureAlbumExists(albumId: number): Promise<Album> {
    const album = await this.albumsRepository.findOne({
      where: { id: albumId, deletedAt: IsNull() },
    });
    if (!album) {
      throw new NotFoundException(`Album ${albumId} not found`);
    }
    return album;
  }

  private validateCreatePayload(dto: CreateAlbumDto) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('title is required');
    }
  }

  private validateMediaPayload(dto: CreateAlbumMediaDto) {
    if (!dto.url?.trim()) {
      throw new BadRequestException('url is required');
    }

    if (!dto.fileName?.trim()) {
      throw new BadRequestException('fileName is required');
    }

    if (!dto.type) {
      throw new BadRequestException('type is required');
    }
  }

  private normalizeAlbumInput(dto: CreateAlbumDto | UpdateAlbumDto) {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { status, visibility, ...rest } = dto;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    const data: Partial<Album> = { ...rest };

    if (typeof data.title === 'string') {
      data.title = data.title.trim();
      if (!data.title) {
        throw new BadRequestException('title cannot be empty');
      }
    }

    return data;
  }

  private normalizeStatus(status: string): AlbumStatus {
    const normalizedStatus = status.trim().toUpperCase();
    if (!ALBUM_STATUSES.includes(normalizedStatus as AlbumStatus)) {
      throw new BadRequestException(`Invalid album status: ${status}`);
    }

    return normalizedStatus as AlbumStatus;
  }

  private normalizeVisibility(visibility: string): AlbumVisibility {
    const normalizedVisibility = visibility.trim().toUpperCase();
    if (!ALBUM_VISIBILITIES.includes(normalizedVisibility as AlbumVisibility)) {
      throw new BadRequestException(`Invalid album visibility: ${visibility}`);
    }

    return normalizedVisibility as AlbumVisibility;
  }

  private normalizeMediaType(type: string): MediaType {
    const normalizedType = type.trim().toUpperCase();
    if (!MEDIA_TYPES.includes(normalizedType as MediaType)) {
      throw new BadRequestException(`Invalid media type: ${type}`);
    }

    return normalizedType as MediaType;
  }
}
