# Gia Phả Backend

Đây là backend cho dự án Web Gia Phả, được xây dựng bằng [NestJS](https://nestjs.com/) framework kết hợp với TypeORM và PostgreSQL.

## Cấu trúc dự án

- **NestJS**: Framework chính để xây dựng API.
- **TypeORM**: ORM dùng để tương tác với cơ sở dữ liệu PostgreSQL.
- **PostgreSQL**: Cơ sở dữ liệu chính lưu trữ thông tin gia phả, thành viên, bài viết, v.v.
- **JWT**: Sử dụng để xác thực và phân quyền người dùng.
- **Multer**: Sử dụng để xử lý việc upload tệp tin (ảnh đại diện, tài liệu, v.v.).

## Các module chính

- **Auth**: Đăng nhập, đăng ký, quên mật khẩu, refresh token.
- **Users**: Quản lý tài khoản người dùng, phân quyền admin/user.
- **Members**: Quản lý thông tin thành viên trong gia phả.
- **Families**: Quản lý thông tin các gia đình, nhánh họ.
- **Posts & Albums**: Quản lý tin tức, sự kiện và thư viện ảnh.
- **Events & Honors**: Quản lý sự kiện dòng họ và bảng vàng thành tích.

## Cài đặt và Chạy

### 1. Yêu cầu hệ thống

- Node.js (v18 trở lên)
- PostgreSQL

### 2. Cài đặt các gói phụ thuộc

```bash
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env` từ file `.env.example` và điền các thông tin cần thiết:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/giapha
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
RESEND_API_KEY=your_resend_api_key
```

### 4. Chạy ứng dụng

```bash
# Chế độ phát triển
npm run start:dev

# Chế độ production
npm run build
npm run start:prod
```

## Kiểm thử (Testing)

```bash
# Chạy unit test
npm run test

# Xem độ phủ mã (coverage)
npm run test:cov
```

## Bảo mật và Quy định (Hardening)

- **Uploads**: Đã sử dụng FileInterceptor để giới hạn kích thước tệp (5MB) và kiểm tra MIME type (chỉ cho phép ảnh và PDF).
- **Phân quyền**: Sử dụng AccessTokenGuard và kiểm tra `isAdmin` kỹ lưỡng trên các endpoint liên quan đến quản trị người dùng.
- **Bảo mật API**: Đã tích hợp `helmet`, `cors`, `rate-limit`.

## Triển khai (Deployment)

Dự án hiện được deploy trên Render. Vui lòng không thay đổi biến môi trường trên production mà không có sự đồng ý của quản trị viên.
