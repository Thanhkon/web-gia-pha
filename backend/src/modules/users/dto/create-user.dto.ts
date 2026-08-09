import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  username!: string;
  password!: string;
  fullName?: string;
  avatarUser?: string;
  phone?: string;
  address?: string;
  // Định dạng ISO, ví dụ: '1998-05-20'
  dateOfBirth?: string;
  // Không bắt buộc, mặc định là UserRole.USER nếu không truyền
  role?: UserRole;
}
