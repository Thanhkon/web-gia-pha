import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsObject,
  IsInt,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUser?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  // Định dạng ISO, ví dụ: '1998-05-20'
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsObject()
  @IsOptional()
  notificationSettings?: any;

  @IsInt()
  @IsOptional()
  preferredFamilyId?: number | null;
}
