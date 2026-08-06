import { UserRole } from '../entities/user.entity';
 
export class UpdateUserDto {
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  // Định dạng ISO, ví dụ: '1998-05-20'
  dateOfBirth?: string;
  role?: UserRole;
}
 
