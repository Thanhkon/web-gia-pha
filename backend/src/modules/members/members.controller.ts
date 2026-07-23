import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CreateFamilyDto } from './dto/create-family.dto';
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
