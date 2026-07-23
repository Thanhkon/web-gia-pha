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
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CreateEditRequestDto } from './dto/create-edit-request.dto';
import { ReviewEditRequestDto } from './dto/review-edit-request.dto';
import { RequestsService } from './requests.service';

@UseGuards(AccessTokenGuard)
@Controller()
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('families/:familyId/edit-requests')
  create(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Body() createEditRequestDto: CreateEditRequestDto,
  ) {
    return this.requestsService.create(familyId, createEditRequestDto);
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
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewEditRequestDto: ReviewEditRequestDto,
  ) {
    return this.requestsService.approve(id, reviewEditRequestDto);
  }

  @Patch('edit-requests/:id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewEditRequestDto: ReviewEditRequestDto,
  ) {
    return this.requestsService.reject(id, reviewEditRequestDto);
  }

  @Delete('edit-requests/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.remove(id);
  }
}
