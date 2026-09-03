import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

describe('JobsController', () => {
  let controller: JobsController;
  const user: JwtPayload = {
    sub: 'authenticated-user',
    email: 'user@example.com',
    sessionId: 'session-1',
  };

  const jobsServiceMock = {
    createForUser: jest.fn(),
    findAllByUserId: jest.fn(),
    findOneByUserIdAndJobId: jest.fn(),
    updateJobForUser: jest.fn(),
    correctStatusForUser: jest.fn(),
    findStatusHistoryForUser: jest.fn(),
    deleteJobForUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [{ provide: JobsService, useValue: jobsServiceMock }],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<JobsController>(JobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call createForUser with the correct parameters', async () => {
    const dto = {
      companyId: 'company-1',
      positionName: 'Software Engineer',
      platform: 'LinkedIn',
    };

    await controller.create(dto, user);

    expect(jobsServiceMock.createForUser).toHaveBeenCalledWith(user.sub, dto);
  });

  it('should call findAllByUserId with the correct parameters', async () => {
    jobsServiceMock.findAllByUserId.mockResolvedValue([]);
    const result = await controller.findAll(user);

    expect(jobsServiceMock.findAllByUserId).toHaveBeenCalledWith(user.sub);

    expect(result).toEqual([]);
  });

  it('should call findOneByUserIdAndJobId with the correct parameters', async () => {
    const jobId = 'job-1';
    jobsServiceMock.findOneByUserIdAndJobId.mockResolvedValue({ id: jobId });

    const result = await controller.findOne(jobId, user);

    expect(jobsServiceMock.findOneByUserIdAndJobId).toHaveBeenCalledWith(
      user.sub,
      jobId,
    );

    expect(result).toEqual({ id: jobId });
  });

  it('should update a job for the current user', async () => {
    const jobId = 'job-1';
    const dto = { positionName: 'Senior Frontend Engineer' };
    const updatedJob = { id: jobId, ...dto };

    jobsServiceMock.updateJobForUser.mockResolvedValue(updatedJob);

    const result = await controller.update(jobId, dto, user);

    expect(jobsServiceMock.updateJobForUser).toHaveBeenCalledWith(
      user.sub,
      jobId,
      dto,
    );
    expect(result).toEqual(updatedJob);
  });

  it('should delete a job for the current user', async () => {
    const jobId = 'job-1';
    const deletedJob = { id: jobId };

    jobsServiceMock.deleteJobForUser.mockResolvedValue(deletedJob);

    const result = await controller.delete(jobId, user);

    expect(jobsServiceMock.deleteJobForUser).toHaveBeenCalledWith(
      user.sub,
      jobId,
    );
    expect(result).toEqual(deletedJob);
  });

  it('should correct a job status for the current user', async () => {
    const dto = { status: 'FIRST_INTERVIEW' as const, reason: 'Mistake' };
    await controller.correctStatus('job-1', dto, user);
    expect(jobsServiceMock.correctStatusForUser).toHaveBeenCalledWith(
      user.sub,
      'job-1',
      dto,
    );
  });

  it('should list a job status history for the current user', async () => {
    jobsServiceMock.findStatusHistoryForUser.mockResolvedValue([]);
    await expect(controller.findStatusHistory('job-1', user)).resolves.toEqual(
      [],
    );
    expect(jobsServiceMock.findStatusHistoryForUser).toHaveBeenCalledWith(
      user.sub,
      'job-1',
    );
  });
});
