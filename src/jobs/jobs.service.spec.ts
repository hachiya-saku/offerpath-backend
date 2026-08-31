import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { JobStatus } from '../../generated/prisma/enums';

describe('JobsService', () => {
  let service: JobsService;

  const prismaMock = {
    company: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    job: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    jobStatusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
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

  it('should find jobs belonging to the user', async () => {
    const userId = 'user-1';

    prismaMock.job.findMany.mockResolvedValue([]);

    const result = await service.findAllByUserId(userId);

    expect(prismaMock.job.findMany).toHaveBeenCalledWith({
      where: { company: { userId } },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    expect(result).toEqual([]);
  });

  it('should find a job by userId and jobId', async () => {
    const userId = 'user-1';
    const jobId = 'job-1';
    const job = {
      id: 'job-1',
      positionName: 'Frontend Engineer',
      company: {
        id: 'company-1',
        name: 'OfferPath Inc.',
      },
    };

    prismaMock.job.findFirst.mockResolvedValue(job);

    const result = await service.findOneByUserIdAndJobId(userId, jobId);

    expect(prismaMock.job.findFirst).toHaveBeenCalledWith({
      where: {
        id: jobId,
        company: { userId },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    expect(result).toEqual(job);
  });

  it('should throw NotFoundException if job is not found', async () => {
    const userId = 'user-1';
    const jobId = 'job-1';

    prismaMock.job.findFirst.mockResolvedValue(null);

    await expect(
      service.findOneByUserIdAndJobId(userId, jobId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should update job fields without changing the company', async () => {
    const userId = 'user-1';
    const jobId = 'job-1';
    const dto = { positionName: 'Senior Frontend Engineer' };
    const updatedJob = { id: jobId, ...dto };

    prismaMock.job.findFirst.mockResolvedValue({ id: jobId });
    prismaMock.job.update.mockResolvedValue(updatedJob);

    const result = await service.updateJobForUser(userId, jobId, dto);

    expect(prismaMock.job.findFirst).toHaveBeenCalledWith({
      where: { id: jobId, company: { userId } },
    });
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: jobId },
      data: {
        positionName: 'Senior Frontend Engineer',
        companyId: undefined,
      },
    });
    expect(result).toEqual(updatedJob);
  });

  it('should throw when updating a job that does not belong to the user', async () => {
    prismaMock.job.findFirst.mockResolvedValue(null);

    await expect(
      service.updateJobForUser('user-1', 'job-1', {
        status: JobStatus.APPLIED,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.job.update).not.toHaveBeenCalled();
  });

  it('should update a job to an existing company owned by the user', async () => {
    const userId = 'user-1';
    const jobId = 'job-1';
    const companyId = 'company-2';

    prismaMock.job.findFirst.mockResolvedValue({ id: jobId });
    prismaMock.company.findFirst.mockResolvedValue({ id: companyId });
    prismaMock.job.update.mockResolvedValue({ id: jobId, companyId });

    await service.updateJobForUser(userId, jobId, { companyId });

    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: { id: companyId, userId },
    });
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: jobId },
      data: { companyId },
    });
  });

  it('should reject a target company that does not belong to the user', async () => {
    prismaMock.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prismaMock.company.findFirst.mockResolvedValue(null);

    await expect(
      service.updateJobForUser('user-1', 'job-1', {
        companyId: 'company-2',
      }),
    ).rejects.toThrow('Company not found');

    expect(prismaMock.job.update).not.toHaveBeenCalled();
  });

  it('should reuse a company found by normalized name when updating', async () => {
    prismaMock.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prismaMock.company.findFirst.mockResolvedValue({ id: 'company-2' });
    prismaMock.job.update.mockResolvedValue({
      id: 'job-1',
      companyId: 'company-2',
    });

    await service.updateJobForUser('user-1', 'job-1', {
      companyName: '  NEW   Company  ',
    });

    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: {
        normalizedName: 'new company',
        userId: 'user-1',
      },
    });
    expect(prismaMock.company.create).not.toHaveBeenCalled();
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { companyId: 'company-2' },
    });
  });

  it('should create a company from its name when updating', async () => {
    prismaMock.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prismaMock.company.findFirst.mockResolvedValue(null);
    prismaMock.company.create.mockResolvedValue({ id: 'company-3' });
    prismaMock.job.update.mockResolvedValue({
      id: 'job-1',
      companyId: 'company-3',
    });

    await service.updateJobForUser('user-1', 'job-1', {
      companyName: 'New Company',
    });

    expect(prismaMock.company.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        name: 'New Company',
        normalizedName: 'new company',
      },
    });
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { companyId: 'company-3' },
    });
  });

  it('should delete a job belonging to the user', async () => {
    const userId = 'user-1';
    const jobId = 'job-1';
    const deletedJob = { id: jobId, positionName: 'Frontend Engineer' };

    prismaMock.job.findFirst.mockResolvedValue({ id: jobId });
    prismaMock.job.delete.mockResolvedValue(deletedJob);

    const result = await service.deleteJobForUser(userId, jobId);

    expect(prismaMock.job.findFirst).toHaveBeenCalledWith({
      where: { id: jobId, company: { userId } },
    });
    expect(prismaMock.job.delete).toHaveBeenCalledWith({
      where: { id: jobId },
    });
    expect(result).toEqual(deletedJob);
  });

  it('should reject deleting a job that does not belong to the user', async () => {
    prismaMock.job.findFirst.mockResolvedValue(null);

    await expect(service.deleteJobForUser('user-1', 'job-1')).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.job.delete).not.toHaveBeenCalled();
  });

  it('should correct a job status and record the history', async () => {
    prismaMock.job.findFirst.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.FINAL_INTERVIEW,
    });
    const updatedJob = { id: 'job-1', status: JobStatus.FIRST_INTERVIEW };
    prismaMock.job.update.mockReturnValue(updatedJob);
    prismaMock.jobStatusHistory.create.mockReturnValue({ id: 'history-1' });
    prismaMock.$transaction.mockResolvedValue([updatedJob, {}]);

    await expect(
      service.correctStatusForUser('user-1', 'job-1', {
        status: JobStatus.FIRST_INTERVIEW,
        reason: 'Wrong selection',
      }),
    ).resolves.toEqual(updatedJob);
    expect(prismaMock.jobStatusHistory.create).toHaveBeenCalledWith({
      data: {
        jobId: 'job-1',
        fromStatus: JobStatus.FINAL_INTERVIEW,
        toStatus: JobStatus.FIRST_INTERVIEW,
        changeType: 'CORRECTION',
        reason: 'Wrong selection',
      },
    });
  });

  it('should list status history for a job belonging to the user', async () => {
    prismaMock.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prismaMock.jobStatusHistory.findMany.mockResolvedValue([]);

    await expect(
      service.findStatusHistoryForUser('user-1', 'job-1'),
    ).resolves.toEqual([]);
    expect(prismaMock.jobStatusHistory.findMany).toHaveBeenCalledWith({
      where: { jobId: 'job-1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
