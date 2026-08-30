import { Test, TestingModule } from '@nestjs/testing';
import { InterviewMode, JobStatus } from '../../generated/prisma/enums';
import { DEMO_USER_ID } from '../common/constants/demo-user';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

describe('InterviewsController', () => {
  let controller: InterviewsController;
  const serviceMock = {
    findAllForUser: jest.fn(),
    createForJob: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewsController],
      providers: [{ provide: InterviewsService, useValue: serviceMock }],
    }).compile();
    controller = module.get(InterviewsController);
  });

  it('should list interviews for the demo user', async () => {
    serviceMock.findAllForUser.mockResolvedValue([]);

    await expect(controller.findAll()).resolves.toEqual([]);
    expect(serviceMock.findAllForUser).toHaveBeenCalledWith(DEMO_USER_ID);
  });

  it('should create an interview for a job', async () => {
    const dto = {
      round: JobStatus.FIRST_INTERVIEW,
      mode: InterviewMode.ONLINE,
      scheduledAt: '2026-09-01T10:00:00+09:00',
      platform: 'Zoom',
    };
    serviceMock.createForJob.mockResolvedValue({ id: 'interview-1' });

    await controller.create('job-1', dto);
    expect(serviceMock.createForJob).toHaveBeenCalledWith(
      DEMO_USER_ID,
      'job-1',
      dto,
    );
  });
});
