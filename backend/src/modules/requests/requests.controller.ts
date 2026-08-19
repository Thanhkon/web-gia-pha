import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreateEditRequestDto } from './dto/create-edit-request.dto';
import { ReviewEditRequestDto } from './dto/review-edit-request.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { ReviewJoinRequestDto } from './dto/review-join-request.dto';
import { RequestsService } from './requests.service';

@UseGuards(AccessTokenGuard)
@Controller()
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('families/:familyId/edit-requests')
  create(
    @Req() request: AuthenticatedRequest,
    @Param('familyId', ParseIntPipe) familyId: number,
    @Body() createEditRequestDto: CreateEditRequestDto,
  ) {
    return this.requestsService.create(
      familyId,
      createEditRequestDto,
      request.user?.id,
    );
  }

  @Get('families/:familyId/edit-requests')
  findByFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Query('status') status?: string,
  ) {
    return this.requestsService.findByFamily(familyId, status);
  }

  @Get('edit-requests/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.findOne(id);
  }

  @Patch('edit-requests/:id/approve')
  approve(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewEditRequestDto: ReviewEditRequestDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.requestsService.approve(
      id,
      request.user.id,
      reviewEditRequestDto,
    );
  }

  @Patch('edit-requests/:id/reject')
  reject(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewEditRequestDto: ReviewEditRequestDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.requestsService.reject(
      id,
      request.user.id,
      reviewEditRequestDto,
    );
  }

  @Delete('edit-requests/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.remove(id);
  }

  // --- JOIN REQUESTS ENDPOINTS ---

  @Post('join-requests')
  createJoinRequest(
    @Req() request: AuthenticatedRequest,
    @Body() createJoinRequestDto: CreateJoinRequestDto,
  ) {
    if (!request.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return this.requestsService.createJoinRequest(
      request.user.id,
      createJoinRequestDto,
    );
  }

  @Get('families/:familyId/join-requests')
  findJoinRequestsByFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Query('status') status?: string,
  ) {
    return this.requestsService.findJoinRequestsByFamily(familyId, status);
  }

  @Patch('join-requests/:id/approve')
  approveJoinRequest(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewJoinRequestDto: ReviewJoinRequestDto,
  ) {
    if (!request.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return this.requestsService.approveJoinRequest(
      id,
      request.user.id,
      reviewJoinRequestDto,
    );
  }

  @Patch('join-requests/:id/reject')
  rejectJoinRequest(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewJoinRequestDto: ReviewJoinRequestDto,
  ) {
    if (!request.user?.id)
      throw new UnauthorizedException('User not authenticated');
    return this.requestsService.rejectJoinRequest(
      id,
      request.user.id,
      reviewJoinRequestDto,
    );
  }
}
