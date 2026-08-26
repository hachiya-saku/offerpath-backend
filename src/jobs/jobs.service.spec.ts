import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('JobsService', () => {
  let service: JobsService;

  const prismaMock = {
    company: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    job: { create: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a job for an existing company', async () => {
    const userId = 'user-1';
    const dto = {
      companyId: 'company-1',
      positionName: 'Software Engineer',
      platform: 'LinkedIn',
    };

    prismaMock.company.findFirst.mockResolvedValue({ id: 'company-1' });
    prismaMock.job.create.mockResolvedValue({ id: 'job-1' });

    const result = await service.createForUser(userId, dto);

    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: { id: dto.companyId, userId },
    });

    expect(prismaMock.job.create).toHaveBeenCalledWith({
      data: {
        companyId: dto.companyId,
        positionName: dto.positionName,
        platform: dto.platform,
      },
    });

    expect(result).toEqual({ id: 'job-1' });
  });

  it('should create a job for a new company', async () => {
    const userId = 'user-1';
    const dto = {
      companyName: 'New Company',
      positionName: 'Software Engineer',
      platform: 'LinkedIn',
    };

    prismaMock.company.findFirst.mockResolvedValue(null);
    prismaMock.company.create.mockResolvedValue({ id: 'company-2' });
    prismaMock.job.create.mockResolvedValue({ id: 'job-2' });

    const result = await service.createForUser(userId, dto);

    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: {
        normalizedName: 'new company',
        userId,
      },
    });

    expect(prismaMock.company.create).toHaveBeenCalledWith({
      data: {
        userId,
        name: dto.companyName,
        normalizedName: 'new company',
      },
    });

    expect(prismaMock.job.create).toHaveBeenCalledWith({
      data: {
        companyId: 'company-2',
        positionName: dto.positionName,
        platform: dto.platform,
      },
    });

    expect(result).toEqual({ id: 'job-2' });
  });

  it('should throw an error if neither companyId nor companyName is provided', async () => {
    const userId = 'user-1';
    const dto = {
      positionName: 'Software Engineer',
      platform: 'LinkedIn',
    };

    await expect(service.createForUser(userId, dto)).rejects.toThrow(
      'Either companyId or companyName must be provided',
    );
  });

  it('should create a job for an existing company by name', async () => {
    const userId = 'user-1';
    const dto = {
      companyName: '  NEW   Company  ',
      positionName: 'Software Engineer',
      platform: 'LinkedIn',
    };

    prismaMock.company.findFirst.mockResolvedValue({ id: 'company-3' });
    prismaMock.job.create.mockResolvedValue({ id: 'job-3' });

    const result = await service.createForUser(userId, dto);

    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: {
        normalizedName: 'new company',
        userId,
      },
    });

    expect(prismaMock.job.create).toHaveBeenCalledWith({
      data: {
        companyId: 'company-3',
        positionName: dto.positionName,
        platform: dto.platform,
      },
    });

    expect(result).toEqual({ id: 'job-3' });

    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it('should throw when the selected company does not belong to the user', async () => {
    const userId = 'user-1';
    const dto = {
      companyId: 'company-1',
      positionName: 'Software Engineer',
      platform: 'LinkedIn',
    };

    prismaMock.company.findFirst.mockResolvedValue(null);

    await expect(service.createForUser(userId, dto)).rejects.toThrow(
      'Company not found',
    );

    expect(prismaMock.job.create).not.toHaveBeenCalled();
  });
});
