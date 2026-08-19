import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
  ParseIntPipe,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable, fromEvent } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../auth/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Sse('stream')
  stream(@Req() request: AuthenticatedRequest): Observable<MessageEvent> {
    if (!request.user?.id) throw new UnauthorizedException();
    const userId = request.user.id;

    return fromEvent(this.eventEmitter, 'notification.created').pipe(
      filter(
        (notification: Notification) => notification.recipientId === userId,
      ),
      map((notification: Notification) => ({
        data: notification,
      })),
    );
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    if (!request.user?.id) throw new UnauthorizedException();
    return this.notificationsService.findAll(request.user.id);
  }

  @Get('unread-count')
  countUnread(@Req() request: AuthenticatedRequest) {
    if (!request.user?.id) throw new UnauthorizedException();
    return this.notificationsService.countUnread(request.user.id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() request: AuthenticatedRequest) {
    if (!request.user?.id) throw new UnauthorizedException();
    return this.notificationsService.markAllAsRead(request.user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user?.id) throw new UnauthorizedException();
    return this.notificationsService.markAsRead(id, request.user.id);
  }
}
