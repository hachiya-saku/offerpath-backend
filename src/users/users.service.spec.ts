import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prismaServiceMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const profileSelect = {
    id: true,
    email: true,
    displayName: true,
    bio: true,
    location: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return only the public profile fields', async () => {
    const profile = {
      id: 'user-1',
      email: 'user@example.com',
      displayName: 'Saku',
      bio: null,
      location: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaServiceMock.user.findUnique.mockResolvedValue(profile);

    await expect(service.findProfile(profile.id)).resolves.toEqual(profile);
    expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: profile.id },
      select: profileSelect,
    });
  });

  it('should throw when the user does not exist', async () => {
    prismaServiceMock.user.findUnique.mockResolvedValue(null);

    await expect(service.findProfile('missing-user')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update only editable profile fields', async () => {
    const existingProfile = {
      id: 'user-1',
      email: 'user@example.com',
      displayName: 'Saku',
      bio: null,
      location: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const dto = {
      displayName: 'Updated Saku',
      bio: 'Frontend engineer',
      location: 'Tokyo, Japan',
      avatarUrl: 'https://example.com/avatar.png',
    };
    const updatedProfile = { ...existingProfile, ...dto };
    prismaServiceMock.user.findUnique.mockResolvedValue(existingProfile);
    prismaServiceMock.user.update.mockResolvedValue(updatedProfile);

    await expect(
      service.updateProfile(existingProfile.id, dto),
    ).resolves.toEqual(updatedProfile);
    expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
      where: { id: existingProfile.id },
      data: dto,
      select: profileSelect,
    });
  });
});
