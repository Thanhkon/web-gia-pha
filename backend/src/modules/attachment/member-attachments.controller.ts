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
import { MemberAttachmentsService } from './member-attachments.service';
import { CreateAttachmentDto } from './dto/create-attachments.dto';
import { UpdateAttachmentDto } from './dto/update-attachments.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
// TODO: sửa lại đường dẫn import AccessTokenGuard cho đúng vị trí thực tế
// TODO: cân nhắc thêm 1 guard/role-check riêng để chỉ super admin (role='admin' ở bảng user)
// mới được gọi create/update/delete, vì đây là API gán quyền — không nên để user thường tự gán.

@Controller('member-attachments')
@UseGuards(AccessTokenGuard)
export class MemberAttachmentsController {
  constructor(private readonly attachmentsService: MemberAttachmentsService) {}

  @Post()
  create(@Body() dto: CreateAttachmentDto) {
    return this.attachmentsService.create(dto);
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.attachmentsService.findAllByUser(userId);
  }

  @Get('member/:memberId')
  findByMember(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.attachmentsService.findByMember(memberId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attachmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttachmentDto,
  ) {
    return this.attachmentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attachmentsService.remove(id);
  }
}
