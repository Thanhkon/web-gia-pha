import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

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

  // Không bắt buộc, mặc định là UserRole.USER nếu không truyền
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
