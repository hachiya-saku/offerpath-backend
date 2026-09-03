import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AccessTokenGuard } from './access-token.guard';

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;
  const jwtServiceMock = { verifyAsync: jest.fn() };
  const configServiceMock = {
    getOrThrow: jest.fn().mockReturnValue('access-secret'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenGuard,
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();
    guard = module.get(AccessTokenGuard);
  });

  function createContext(authorization?: string) {
    const request = {
      headers: authorization ? { authorization } : {},
    } as Request;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    return { context, request };
  }

  it('should reject a request without a bearer token', async () => {
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  it('should reject an invalid access token', async () => {
    const { context } = createContext('Bearer invalid-token');
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should attach a valid payload to the request', async () => {
    const { context, request } = createContext('Bearer valid-token');
    const payload = {
      sub: 'user-1',
      email: 'user@example.com',
      sessionId: 'session-1',
    };
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: 'access-secret',
    });
    expect(request).toMatchObject({ user: payload });
  });

  it('should reject a token without a session ID', async () => {
    const { context } = createContext('Bearer legacy-token');
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
