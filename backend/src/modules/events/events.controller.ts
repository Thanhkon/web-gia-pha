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
  UnauthorizedException, // 👈 thêm
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../../utils/file-upload.util';
import type { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@UseGuards(AccessTokenGuard)
@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('families/:familyId/events')
  create(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Req() request: AuthenticatedRequest,
    @Body() createEventDto: CreateEventDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.eventsService.create(familyId, request.user.id, createEventDto);
  }

  @Get('families/:familyId/events')
  findByFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
    @Query('eventType') eventType?: string,
    @Query('includeDeleted', new ParseBoolPipe({ optional: true }))
    includeDeleted?: boolean,
  ) {
    return this.eventsService.findByFamily(familyId, {
      status,
      visibility,
      eventType,
      includeDeleted,
    });
  }

  @Get('events/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @Patch('events/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest, // 👈 thêm
    @Body() updateEventDto: UpdateEventDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.eventsService.update(id, request.user.id, updateEventDto); // 👈
  }

  @Post('families/:familyId/upload')
  @UseInterceptors(FileInterceptor('image', multerOptions()))
  uploadCoverImage(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest, // 👈 thêm
    @UploadedFile() file?: UploadedStorageFile,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.eventsService.uploadCoverImage(id, request.user.id, file);
  }

  @Delete('events/:id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.eventsService.remove(id, request.user.id);
  }

  @Patch('events/:id/restore')
  restore(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.eventsService.restore(id, request.user.id);
  }
}
