import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
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
  createFamily(@Body() createFamilyDto: CreateFamilyDto) {
    return this.membersService.createFamily(createFamilyDto);
  }

  @Get('families/:familyId')
  findOneFamily(@Param('familyId', ParseIntPipe) familyId: number) {
    return this.membersService.findOneFamily(familyId);
  }

  @Patch('families/:familyId')
  updateFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ) {
    return this.membersService.updateFamily(familyId, updateFamilyDto);
  }

  @Post('families/:familyId/cover-image')
  @UseInterceptors(FileInterceptor('image'))
  uploadFamilyCover(
    @Param('familyId', ParseIntPipe) familyId: number,
    @UploadedFile() file?: UploadedStorageFile,
  ) {
    return this.membersService.uploadFamilyCover(familyId, file);
  }

  @Delete('families/:familyId')
  removeFamily(@Param('familyId', ParseIntPipe) familyId: number) {
    return this.membersService.removeFamily(familyId);
  }

  @Get('families/:familyId/members')
  findMembersByFamily(@Param('familyId', ParseIntPipe) familyId: number) {
    return this.membersService.findMembersByFamily(familyId);
  }

  @Post('families/:familyId/members')
  createMember(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Body() createMemberDto: CreateMemberDto,
  ) {
    return this.membersService.createMember(familyId, createMemberDto);
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
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.updateMember(id, updateMemberDto);
  }

  @Post('members/:id/avatar')
  @UseInterceptors(FileInterceptor('image'))
  uploadMemberAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: UploadedStorageFile,
  ) {
    return this.membersService.uploadMemberAvatar(id, file);
  }

  @Delete('members/:id')
  removeMember(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.removeMember(id);
  }

  @Post('parent-child-relations')
  createParentChildRelation(@Body() dto: CreateParentChildRelationDto) {
    return this.membersService.createParentChildRelation(dto);
  }

  @Post('marriages')
  createMarriage(@Body() dto: CreateMarriageDto) {
    return this.membersService.createMarriage(dto);
  }
}
