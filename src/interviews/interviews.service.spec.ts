import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InterviewMode, JobStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewsService } from './interviews.service';

describe('InterviewsService', () => {
  let service: InterviewsService;
  const prismaMock = {
    job: { findFirst: jest.fn(), update: jest.fn() },
    interview: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    jobStatusHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(InterviewsService);
  });

  it('should list interviews belonging to the user', async () => {
    prismaMock.interview.findMany.mockResolvedValue([]);

    await expect(service.findAllForUser('user-1')).resolves.toEqual([]);
    expect(prismaMock.interview.findMany).toHaveBeenCalledWith({
      where: { job: { company: { userId: 'user-1' } } },
      include: {
        job: {
          select: {
            id: true,
            positionName: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  });

  it('should create an online interview and advance the job status', async () => {
    const dto = {
      round: JobStatus.FIRST_INTERVIEW,
      mode: InterviewMode.ONLINE,
      scheduledAt: '2026-09-01T10:00:00+09:00',
      platform: 'Zoom',
      meetingId: '123-456',
    };
    const interview = { id: 'interview-1', jobId: 'job-1', ...dto };
    prismaMock.job.findFirst.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.DOCUMENT_SCREENING,
    });
    prismaMock.interview.create.mockReturnValue(interview);
    prismaMock.job.update.mockReturnValue({
      id: 'job-1',
      status: dto.round,
    });
    prismaMock.$transaction.mockResolvedValue([interview, {}]);

    await expect(service.createForJob('user-1', 'job-1', dto)).resolves.toEqual(
      interview,
    );
    expect(prismaMock.interview.create).toHaveBeenCalledWith({
      data: {
        jobId: 'job-1',
        round: JobStatus.FIRST_INTERVIEW,
        previousJobStatus: JobStatus.DOCUMENT_SCREENING,
        mode: InterviewMode.ONLINE,
        scheduledAt: new Date(dto.scheduledAt),
        platform: 'Zoom',
        meetingUrl: undefined,
        meetingId: '123-456',
        meetingPassword: undefined,
        location: null,
        notes: undefined,
      },
      include: {
        job: {
          select: {
            id: true,
            positionName: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    });
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { status: JobStatus.FIRST_INTERVIEW },
    });
  });

  it('should allow skipping forward to a later interview round', async () => {
    prismaMock.job.findFirst.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.DOCUMENT_SCREENING,
    });
    const interview = {
      id: 'interview-1',
      jobId: 'job-1',
      round: JobStatus.FINAL_INTERVIEW,
    };
    prismaMock.interview.create.mockReturnValue(interview);
    prismaMock.job.update.mockReturnValue({
      id: 'job-1',
      status: JobStatus.FINAL_INTERVIEW,
    });
    prismaMock.$transaction.mockResolvedValue([interview, {}]);

    await expect(
      service.createForJob('user-1', 'job-1', {
        round: JobStatus.FINAL_INTERVIEW,
        mode: InterviewMode.OFFLINE,
        scheduledAt: '2026-09-01T10:00:00+09:00',
        location: 'Tokyo',
      }),
    ).resolves.toEqual(interview);
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { status: JobStatus.FINAL_INTERVIEW },
    });
  });

  it('should reject moving back to an earlier interview round', async () => {
    prismaMock.job.findFirst.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.SECOND_INTERVIEW,
    });

    await expect(
      service.createForJob('user-1', 'job-1', {
        round: JobStatus.FIRST_INTERVIEW,
        mode: InterviewMode.OFFLINE,
        scheduledAt: '2026-09-01T10:00:00+09:00',
        location: 'Tokyo',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('should reject a job that does not belong to the user', async () => {
    prismaMock.job.findFirst.mockResolvedValue(null);

    await expect(
      service.createForJob('user-1', 'job-1', {
        round: JobStatus.FIRST_INTERVIEW,
        mode: InterviewMode.OFFLINE,
        scheduledAt: '2026-09-01T10:00:00+09:00',
        location: 'Tokyo',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should undo the latest scheduled interview and restore the status', async () => {
    prismaMock.interview.findFirst.mockResolvedValue({
      id: 'interview-1',
      jobId: 'job-1',
      round: JobStatus.FINAL_INTERVIEW,
      previousJobStatus: JobStatus.FIRST_INTERVIEW,
      job: { status: JobStatus.FINAL_INTERVIEW },
    });
    prismaMock.interview.delete.mockReturnValue({ id: 'interview-1' });
    const restoredJob = { id: 'job-1', status: JobStatus.FIRST_INTERVIEW };
    prismaMock.job.update.mockReturnValue(restoredJob);
    prismaMock.$transaction.mockResolvedValue([{}, restoredJob, {}]);

    await expect(
      service.undoForJob('user-1', 'job-1', 'interview-1'),
    ).resolves.toEqual(restoredJob);
    expect(prismaMock.interview.delete).toHaveBeenCalledWith({
      where: { id: 'interview-1' },
    });
    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { status: JobStatus.FIRST_INTERVIEW },
    });
  });

  it('should reject undoing an interview that is no longer the latest change', async () => {
    prismaMock.interview.findFirst.mockResolvedValue({
      id: 'interview-1',
      round: JobStatus.FIRST_INTERVIEW,
      previousJobStatus: JobStatus.DOCUMENT_SCREENING,
      job: { status: JobStatus.SECOND_INTERVIEW },
    });

    await expect(
      service.undoForJob('user-1', 'job-1', 'interview-1'),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
