import { Test, TestingModule } from '@nestjs/testing';
import { InterviewMode, JobStatus } from '../../generated/prisma/enums';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

describe('InterviewsController', () => {
  let controller: InterviewsController;
  const user: JwtPayload = {
    sub: 'authenticated-user',
    email: 'user@example.com',
  };
  const serviceMock = {
    findAllForUser: jest.fn(),
    createForJob: jest.fn(),
    undoForJob: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewsController],
      providers: [{ provide: InterviewsService, useValue: serviceMock }],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(InterviewsController);
  });

  it('should list interviews for the current user', async () => {
    serviceMock.findAllForUser.mockResolvedValue([]);

    await expect(controller.findAll(user)).resolves.toEqual([]);
    expect(serviceMock.findAllForUser).toHaveBeenCalledWith(user.sub);
  });

  it('should create an interview for a job', async () => {
    const dto = {
      round: JobStatus.FIRST_INTERVIEW,
      mode: InterviewMode.ONLINE,
      scheduledAt: '2026-09-01T10:00:00+09:00',
      platform: 'Zoom',
    };
    serviceMock.createForJob.mockResolvedValue({ id: 'interview-1' });

    await controller.create('job-1', dto, user);
    expect(serviceMock.createForJob).toHaveBeenCalledWith(
      user.sub,
      'job-1',
      dto,
    );
  });

  it('should undo an interview for a job', async () => {
    serviceMock.undoForJob.mockResolvedValue({ id: 'job-1' });

    await controller.undo('job-1', 'interview-1', user);
    expect(serviceMock.undoForJob).toHaveBeenCalledWith(
      user.sub,
      'job-1',
      'interview-1',
    );
  });
});
