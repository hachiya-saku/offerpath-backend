import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from './guards/access-token.guard';
import type { JwtPayload } from './types/jwt-payload.type';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should forward registration data to AuthService', async () => {
    const dto = {
      email: 'test@example.com',
      displayName: 'Saku',
      password: 'password123',
    };
    const createdUser = {
      id: 'user-1',
      email: dto.email,
      displayName: dto.displayName,
    };

    authServiceMock.register.mockResolvedValue(createdUser);

    const result = await controller.register(dto);

    expect(authServiceMock.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual(createdUser);
  });

  it('should forward login data to AuthService', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const loginResult = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1', email: dto.email, displayName: 'Saku' },
    };
    authServiceMock.login.mockResolvedValue(loginResult);

    const result = await controller.login(dto);

    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(loginResult);
  });

  it('should forward refresh data to AuthService', async () => {
    const dto = { refreshToken: 'refresh-token' };
    const tokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };
    authServiceMock.refresh.mockResolvedValue(tokens);

    await expect(controller.refresh(dto)).resolves.toEqual(tokens);
    expect(authServiceMock.refresh).toHaveBeenCalledWith(dto);
  });

  it('should log out the current user', async () => {
    const user: JwtPayload = {
      sub: 'user-1',
      email: 'test@example.com',
      sessionId: 'session-1',
    };
    const response = { message: 'Logged out successfully' };
    authServiceMock.logout.mockResolvedValue(response);

    await expect(controller.logout(user)).resolves.toEqual(response);
    expect(authServiceMock.logout).toHaveBeenCalledWith(
      user.sub,
      user.sessionId,
    );
  });
});
