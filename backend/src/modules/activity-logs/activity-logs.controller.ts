import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityAction } from './entities/activity-log.entity';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../auth/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Controller('families/:familyId/activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Param('familyId') familyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: ActivityAction,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    // Ideally we should check if request.user is admin of familyId here
    return this.activityLogsService.findByFamily(+familyId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      action,
      fromDate,
      toDate,
    });
  }
}
