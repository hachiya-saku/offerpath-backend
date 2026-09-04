import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

jest.mock('bcryptjs');

const hashMock = jest.mocked(hash);
const compareMock = jest.mocked(compare);
const refreshHash = (token: string) =>
  createHash('sha256').update(token).digest('hex');

type CreateRefreshSessionArgs = {
  data: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  };
};

describe('AuthService', () => {
  let service: AuthService;
  let createdSessionArgs: CreateRefreshSessionArgs | undefined;

  const prismaServiceMock = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    refreshSession: {
      create: jest.fn((args: CreateRefreshSessionArgs) => {
        createdSessionArgs = args;
        return Promise.resolve();
      }),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };
  const configServiceMock = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    createdSessionArgs = undefined;
    hashMock.mockResolvedValue('hashed-password');
    compareMock.mockResolvedValue(true);
    jwtServiceMock.signAsync.mockReset();
    jwtServiceMock.verifyAsync.mockReset();
    jwtServiceMock.decode.mockReturnValue({ exp: 2_000_000_000 });
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user with normalized data and a hashed password', async () => {
    const dto = {
      email: '  Test@Example.com ',
      displayName: '  Saku ',
      password: 'password123',
    };
    const createdAt = new Date();
    const createdUser = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Saku',
      createdAt,
    };

    prismaServiceMock.user.findUnique.mockResolvedValue(null);
    prismaServiceMock.user.create.mockResolvedValue(createdUser);

    const result = await service.register(dto);

    expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(prismaServiceMock.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        displayName: 'Saku',
        passwordCredential: {
          create: {
            passwordHash: 'hashed-password',
          },
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });
    expect(hashMock).toHaveBeenCalledWith(dto.password, 12);
    expect(result).toEqual(createdUser);
  });

  it('should reject an email that is already registered', async () => {
    prismaServiceMock.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await expect(
      service.register({
        email: 'TEST@example.com',
        displayName: 'Saku',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);

    expect(prismaServiceMock.user.create).not.toHaveBeenCalled();
  });

  it('should return a token pair, persist the refresh hash, and return safe user data', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Saku',
      passwordCredential: { passwordHash: 'hashed-password' },
    };
    prismaServiceMock.user.findUnique.mockResolvedValue(user);

    const result = await service.login({
      email: '  TEST@example.com ',
      password: 'password123',
    });

    expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      include: { passwordCredential: true },
    });
    expect(compareMock).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(jwtServiceMock.signAsync).toHaveBeenCalledTimes(2);
    expect(createdSessionArgs?.data.userId).toBe(user.id);
    expect(createdSessionArgs?.data.refreshTokenHash).toBe(
      refreshHash('refresh-token'),
    );
    expect(createdSessionArgs?.data.expiresAt).toEqual(
      new Date(2_000_000_000 * 1000),
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  });

  it('should reject login when the user or password credential is missing', async () => {
    prismaServiceMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(compareMock).not.toHaveBeenCalled();
    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });

  it('should reject login when the password is invalid', async () => {
    prismaServiceMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Saku',
      passwordCredential: { passwordHash: 'hashed-password' },
    });
    compareMock.mockResolvedValue(false);

    await expect(
      service.login({ email: 'test@example.com', password: 'wrongpass' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });

  it('should rotate a valid refresh token', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Saku',
    };
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: user.id,
      email: user.email,
      sessionId: 'session-1',
    });
    prismaServiceMock.refreshSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: user.id,
      refreshTokenHash: refreshHash('old-refresh-token'),
      user,
    });
    prismaServiceMock.refreshSession.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.refresh('old-refresh-token');

    expect(prismaServiceMock.refreshSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        refreshTokenHash: refreshHash('old-refresh-token'),
      },
      data: {
        refreshTokenHash: refreshHash('refresh-token'),
        expiresAt: new Date(2_000_000_000 * 1000),
      },
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('should reject an invalid refresh token signature', async () => {
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(service.refresh('invalid-refresh-token')).rejects.toThrow(
      UnauthorizedException,
    );

    expect(prismaServiceMock.refreshSession.findUnique).not.toHaveBeenCalled();
  });

  it('should reject a refresh token that does not match the stored hash', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'test@example.com',
      sessionId: 'session-1',
    });
    prismaServiceMock.refreshSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: 'stored-refresh-hash',
      user: { id: 'user-1', email: 'test@example.com' },
    });
    await expect(service.refresh('old-refresh-token')).rejects.toThrow(
      UnauthorizedException,
    );

    expect(prismaServiceMock.refreshSession.updateMany).not.toHaveBeenCalled();
  });

  it('should delete only the current session on logout', async () => {
    prismaServiceMock.refreshSession.deleteMany.mockResolvedValue({
      count: 1,
    });

    await expect(service.logout('user-1', 'session-1')).resolves.toEqual({
      message: 'Logged out successfully',
    });
    expect(prismaServiceMock.refreshSession.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', id: 'session-1' },
    });
  });
});
