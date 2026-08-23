import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const prismaMock = {
    company: {
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(() => Promise.resolve({ id: 'company-1' })),
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
        website: dto.website,
        notes: dto.notes,
      },
    });
    expect(result).toEqual({ id: 'company-1' });
  });
});
