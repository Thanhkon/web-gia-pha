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
  UseGuards,
} from '@nestjs/common';
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
    return this.eventsService.create(familyId, request.user!.id, createEventDto);
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
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete('events/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.remove(id);
  }

  @Patch('events/:id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.restore(id);
  }
}
