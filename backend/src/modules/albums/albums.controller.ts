import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../../utils/file-upload.util';
import type { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { CreateAlbumMediaDto } from './dto/create-album-media.dto';
import { UpdateAlbumMediaDto } from './dto/update-album-media.dto';
import { AlbumsService } from './albums.service';

@UseGuards(AccessTokenGuard)
@Controller()
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post('families/:familyId/albums')
  create(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Req() request: AuthenticatedRequest,
    @Body() createAlbumDto: CreateAlbumDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.albumsService.create(familyId, request.user.id, createAlbumDto);
  }

  @Get('families/:familyId/albums')
  findByFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
    @Query('includeDeleted', new ParseBoolPipe({ optional: true }))
    includeDeleted?: boolean,
  ) {
    return this.albumsService.findByFamily(familyId, {
      status,
      visibility,
      includeDeleted,
    });
  }

  @Get('albums/:id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeDeletedMedia', new ParseBoolPipe({ optional: true }))
    includeDeletedMedia?: boolean,
  ) {
    return this.albumsService.findOne(id, { includeDeletedMedia });
  }

  @Patch('albums/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Body() updateAlbumDto: UpdateAlbumDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.albumsService.update(id, request.user.id, updateAlbumDto);
  }

  @Post('albums/:id/cover-image')
  @UseInterceptors(FileInterceptor('image', multerOptions(true)))
  uploadCoverImage(
    @Param('id', ParseIntPipe) albumId: number,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: UploadedStorageFile,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.albumsService.uploadCoverImage(albumId, request.user.id, file);
  }

  @Delete('albums/:id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.albumsService.remove(id, request.user.id);
  }

  @Patch('albums/:id/restore')
  restore(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.albumsService.restore(id, request.user.id);
  }

  @Post('albums/:id/media')
  addMedia(
    @Param('id', ParseIntPipe) albumId: number,
    @Req() request: AuthenticatedRequest,
    @Body() createAlbumMediaDto: CreateAlbumMediaDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.albumsService.addMedia(
      albumId,
      request.user.id,
      createAlbumMediaDto,
    );
  }

  @Post('albums/:id/media/uploads')
  @UseInterceptors(FileInterceptor('file', multerOptions(true)))
  uploadMedia(
    @Param('id', ParseIntPipe) albumId: number,
    @Req() request: AuthenticatedRequest,
    @Body('description') description?: string,
    @UploadedFile() file?: UploadedStorageFile,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.albumsService.uploadMedia(
      albumId,
      request.user.id,
      file,
      description,
    );
  }

  @Patch('albums/:id/media/:mediaId')
  updateMedia(
    @Param('id', ParseIntPipe) albumId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() request: AuthenticatedRequest,
    @Body() updateAlbumMediaDto: UpdateAlbumMediaDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.albumsService.updateMedia(
      albumId,
      mediaId,
      request.user.id,
      updateAlbumMediaDto,
    );
  }

  @Delete('albums/:id/media/:mediaId')
  removeMedia(
    @Param('id', ParseIntPipe) albumId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.albumsService.removeMedia(albumId, mediaId, request.user.id);
  }

  @Patch('albums/:id/media/:mediaId/restore')
  restoreMedia(
    @Param('id', ParseIntPipe) albumId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.albumsService.restoreMedia(albumId, mediaId, request.user.id);
  }
}
