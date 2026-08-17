import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../auth/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
