import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { CreateMarriageDto } from './dto/create-marriage.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateParentChildRelationDto } from './dto/create-parent-child-relation.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';

@UseGuards(AccessTokenGuard)
@Controller()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post('families')
  createFamily(
    @Req() request: AuthenticatedRequest,
    @Body() createFamilyDto: CreateFamilyDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.createFamily(createFamilyDto, request.user.id);
  }

  @Get('families')
  findAllFamilies(@Req() request: AuthenticatedRequest) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.findAllFamilies(request.user.id);
  }

  @Get('families/code/:code')
  findFamilyByCode(@Param('code') code: string) {
    return this.membersService.findFamilyByCode(code);
  }

  @Get('families/:familyId')
  findOneFamily(@Param('familyId', ParseIntPipe) familyId: number) {
    return this.membersService.findOneFamily(familyId);
  }

  @Patch('families/:familyId')
  updateFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Req() request: AuthenticatedRequest,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.updateFamily(
      familyId,
      request.user.id,
      updateFamilyDto,
    );
  }

  @Post('families/:familyId/cover-image')
  @UseInterceptors(FileInterceptor('image'))
  uploadFamilyCover(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: UploadedStorageFile,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.uploadFamilyCover(
      familyId,
      request.user.id,
      file,
    );
  }

  @Delete('families/:familyId')
  removeFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.removeFamily(familyId, request.user.id);
  }

  @Get('families/:familyId/members')
  findMembersByFamily(@Param('familyId', ParseIntPipe) familyId: number) {
    return this.membersService.findMembersByFamily(familyId);
  }

  @Post('families/:familyId/members')
  createMember(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Req() request: AuthenticatedRequest,
    @Body() createMemberDto: CreateMemberDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.createMember(
      familyId,
      request.user.id,
      createMemberDto,
    );
  }

  @Get('families/:familyId/members/:memberId')
  findOneMemberInFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.membersService.findOneMemberInFamily(familyId, memberId);
  }

  @Get('members/:id')
  findOneMember(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.findOneMember(id);
  }

  @Patch('members/:id')
  updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.updateMember(
      id,
      request.user.id,
      updateMemberDto,
    );
  }

  @Post('members/:id/avatar')
  @UseInterceptors(FileInterceptor('image'))
  uploadMemberAvatar(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: UploadedStorageFile,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.uploadMemberAvatar(id, request.user.id, file);
  }

  @Delete('members/:id')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.removeMember(id, request.user.id);
  }

  @Post('parent-child-relations')
  createParentChildRelation(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateParentChildRelationDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.createParentChildRelation(dto, request.user.id);
  }

  @Post('marriages')
  createMarriage(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateMarriageDto,
  ) {
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.membersService.createMarriage(dto, request.user.id);
  }
}
