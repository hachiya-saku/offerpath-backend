import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

jest.mock('bcryptjs');

const hashMock = jest.mocked(hash);
const compareMock = jest.mocked(compare);

describe('AuthService', () => {
  let service: AuthService;

  const prismaServiceMock = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    hashMock.mockResolvedValue('hashed-password');
    compareMock.mockResolvedValue(true);
    jwtServiceMock.signAsync.mockResolvedValue('access-token');
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

  it('should return an access token and safe user data for valid credentials', async () => {
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
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
    expect(result).toEqual({
      accessToken: 'access-token',
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
});
