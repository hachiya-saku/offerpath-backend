import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const prismaMock = {
    company: {
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(() => Promise.resolve({ id: 'company-1' })),
      findFirst: jest.fn(() => Promise.resolve({ id: 'company-1' })),
      update: jest.fn(() => Promise.resolve({ id: 'company-1' })),
      delete: jest.fn(() => Promise.resolve({ id: 'company-1' })),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find companies belonging to the user', async () => {
    const userId = 'user-1';

    const result = await service.findAllByUserId(userId);

    expect(prismaMock.company.findMany).toHaveBeenCalledWith({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    expect(result).toEqual([]);
  });

  it('should create a company for the user', async () => {
    const userId = 'user-1';
    const dto = {
      name: 'OfferPath Inc.',
      website: 'https://example.com',
      notes: 'Demo company',
    };

    const result = await service.createForUser(userId, dto);

    expect(prismaMock.company.create).toHaveBeenCalledWith({
      data: {
        userId,
        name: dto.name,
        normalizedName: 'offerpath inc.',
        website: dto.website,
        notes: dto.notes,
      },
    });
    expect(result).toEqual({ id: 'company-1' });
  });

  it('should update a company for the user', async () => {
    const userId = 'user-1';
    const companyId = 'company-1';
    const dto = {
      name: 'Updated Company Name',
      website: 'https://updated.com',
      notes: 'Updated notes',
    };

    const result = await service.updateForUser(userId, companyId, dto);

    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: { id: companyId, userId },
    });

    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: { id: companyId },
      data: {
        name: dto.name,
        normalizedName: 'updated company name',
        website: dto.website,
        notes: dto.notes,
      },
    });

    expect(result).toEqual({ id: 'company-1' });
  });

  it('should throw when updating a company that does not exist', async () => {
    const userId = 'user-1';
    const companyId = 'non-existent-company';
    const dto = {
      name: 'Updated Company Name',
      website: 'https://updated.com',
      notes: 'Updated notes',
    };

    prismaMock.company.findFirst.mockResolvedValueOnce(null);

    await expect(service.updateForUser(userId, companyId, dto)).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.company.update).not.toHaveBeenCalled();
  });

  it('should throw when deleting a company that does not exist', async () => {
    const userId = 'user-1';
    const companyId = 'non-existent-company';

    prismaMock.company.findFirst.mockResolvedValueOnce(null);

    await expect(service.deleteForUser(userId, companyId)).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.company.delete).not.toHaveBeenCalled();
  });

  it('should delete a company for the user', async () => {
    const userId = 'user-1';
    const companyId = 'company-1';

    const result = await service.deleteForUser(userId, companyId);

    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: { id: companyId, userId },
    });

    expect(prismaMock.company.delete).toHaveBeenCalledWith({
      where: { id: companyId },
    });
    expect(result).toEqual({ id: 'company-1' });
  });
});
