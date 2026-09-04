import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from './guards/access-token.guard';
import type { JwtPayload } from './types/jwt-payload.type';
import type { Request, Response } from 'express';
import { REFRESH_TOKEN_COOKIE } from './utils/refresh-token-cookie';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };
  const createResponseMock = () => {
    const cookie = jest.fn();
    const clearCookie = jest.fn();

    return {
      cookie,
      clearCookie,
      response: {
        cookie,
        clearCookie,
      } as unknown as Response,
    };
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

    const responseMock = createResponseMock();
    const result = await controller.login(dto, responseMock.response);

    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    expect(responseMock.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      loginResult.refreshToken,
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    expect(result).toEqual({
      accessToken: loginResult.accessToken,
      user: loginResult.user,
    });
  });

  it('should read, rotate, and hide the refresh token', async () => {
    const tokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };
    authServiceMock.refresh.mockResolvedValue(tokens);
    const request = {
      cookies: { [REFRESH_TOKEN_COOKIE]: 'refresh-token' },
    } as unknown as Request;
    const responseMock = createResponseMock();

    await expect(
      controller.refresh(request, responseMock.response),
    ).resolves.toEqual({ accessToken: tokens.accessToken });
    expect(authServiceMock.refresh).toHaveBeenCalledWith('refresh-token');
    expect(responseMock.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
  });

  it('should log out the current user', async () => {
    const user: JwtPayload = {
      sub: 'user-1',
      email: 'test@example.com',
      sessionId: 'session-1',
    };
    const response = { message: 'Logged out successfully' };
    authServiceMock.logout.mockResolvedValue(response);
    const responseMock = createResponseMock();

    await expect(
      controller.logout(user, responseMock.response),
    ).resolves.toEqual(response);
    expect(authServiceMock.logout).toHaveBeenCalledWith(
      user.sub,
      user.sessionId,
    );
    expect(responseMock.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
  });
});
