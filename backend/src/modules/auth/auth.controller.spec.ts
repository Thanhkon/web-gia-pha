/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedRequest } from './guards/access-token.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            changePassword: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
  });

  it('should call authService.register', async () => {
    const dto: RegisterDto = { username: 'test', password: 'password' };
    await controller.register(dto);
    expect(authService.register as jest.Mock).toHaveBeenCalledWith(dto);
  });

  it('should call authService.login', async () => {
    const dto: LoginDto = { username: 'test', password: 'password' };
    await controller.login(dto);
    expect(authService.login as jest.Mock).toHaveBeenCalledWith(dto);
  });

  it('should return user from request in me()', () => {
    const req = {
      user: { id: 1, username: 'test' },
    } as unknown as AuthenticatedRequest;
    const result = controller.me(req);
    expect(result).toEqual(req.user);
  });

  it('should call authService.refreshToken', async () => {
    const dto: RefreshTokenDto = { refreshToken: 'token' };
    await controller.refreshToken(dto);
    expect(authService.refreshToken as jest.Mock).toHaveBeenCalledWith(dto);
  });

  it('should call authService.logout', async () => {
    const dto: RefreshTokenDto = { refreshToken: 'token' };
    await controller.logout(dto);
    expect(authService.logout as jest.Mock).toHaveBeenCalledWith(dto);
  });

  it('should call authService.forgotPassword', async () => {
    const dto: ForgotPasswordDto = { username: 'test' };
    await controller.forgotPassword(dto);
    expect(authService.forgotPassword as jest.Mock).toHaveBeenCalledWith(dto);
  });

  it('should call authService.resetPassword', async () => {
    const dto: ResetPasswordDto = {
      resetToken: 'token',
      newPassword: 'password',
    };
    await controller.resetPassword(dto);
    expect(authService.resetPassword as jest.Mock).toHaveBeenCalledWith(dto);
  });

  it('should call authService.changePassword', async () => {
    const dto: ChangePasswordDto = {
      username: 'test',
      currentPassword: 'old',
      newPassword: 'new',
    };
    await controller.changePassword(dto);
    expect(authService.changePassword as jest.Mock).toHaveBeenCalledWith(dto);
  });
});
