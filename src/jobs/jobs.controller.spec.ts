import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { DEMO_USER_ID } from '../common/constants/demo-user';

describe('JobsController', () => {
  let controller: JobsController;

  const jobsServiceMock = {
    createForUser: jest.fn(),
    findAllByUserId: jest.fn(),
    findOneByUserIdAndJobId: jest.fn(),
    updateJobForUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [{ provide: JobsService, useValue: jobsServiceMock }],
    }).compile();

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

    await controller.create(dto);

    expect(jobsServiceMock.createForUser).toHaveBeenCalledWith(
      DEMO_USER_ID,
      dto,
    );
  });

  it('should call findAllByUserId with the correct parameters', async () => {
    jobsServiceMock.findAllByUserId.mockResolvedValue([]);
    const result = await controller.findAll();

    expect(jobsServiceMock.findAllByUserId).toHaveBeenCalledWith(DEMO_USER_ID);

    expect(result).toEqual([]);
  });

  it('should call findOneByUserIdAndJobId with the correct parameters', async () => {
    const jobId = 'job-1';
    jobsServiceMock.findOneByUserIdAndJobId.mockResolvedValue({ id: jobId });

    const result = await controller.findOne(jobId);

    expect(jobsServiceMock.findOneByUserIdAndJobId).toHaveBeenCalledWith(
      DEMO_USER_ID,
      jobId,
    );

    expect(result).toEqual({ id: jobId });
  });

  it('should update a job for the demo user', async () => {
    const jobId = 'job-1';
    const dto = { positionName: 'Senior Frontend Engineer' };
    const updatedJob = { id: jobId, ...dto };

    jobsServiceMock.updateJobForUser.mockResolvedValue(updatedJob);

    const result = await controller.update(jobId, dto);

    expect(jobsServiceMock.updateJobForUser).toHaveBeenCalledWith(
      DEMO_USER_ID,
      jobId,
      dto,
    );
    expect(result).toEqual(updatedJob);
  });
});
