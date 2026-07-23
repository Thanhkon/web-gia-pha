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
import { CreateHonorDto } from './dto/create-honor.dto';
import { UpdateHonorDto } from './dto/update-honor.dto';
import { HonorsService } from './honors.service';

@UseGuards(AccessTokenGuard)
@Controller()
export class HonorsController {
  constructor(private readonly honorsService: HonorsService) {}

  @Post('families/:familyId/honors')
  create(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Req() request: AuthenticatedRequest,
    @Body() createHonorDto: CreateHonorDto,
  ) {
    return this.honorsService.create(familyId, request.user!.id, createHonorDto);
  }

  @Get('families/:familyId/honors')
  findByFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Query('memberId') memberId?: string,
    @Query('status') status?: string,
    @Query('honorType') honorType?: string,
    @Query('includeDeleted', new ParseBoolPipe({ optional: true }))
    includeDeleted?: boolean,
  ) {
    return this.honorsService.findByFamily(familyId, {
      memberId: memberId ? Number(memberId) : undefined,
      status,
      honorType,
      includeDeleted,
    });
  }

  @Get('honors/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.honorsService.findOne(id);
  }

  @Patch('honors/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHonorDto: UpdateHonorDto,
  ) {
    return this.honorsService.update(id, updateHonorDto);
  }

  @Delete('honors/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.honorsService.remove(id);
  }

  @Patch('honors/:id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.honorsService.restore(id);
  }
}
