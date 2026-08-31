import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, JobStatusChangeType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';

const interviewStatusOrder = [
  JobStatus.DOCUMENT_SCREENING,
  JobStatus.FIRST_INTERVIEW,
  JobStatus.SECOND_INTERVIEW,
  JobStatus.THIRD_INTERVIEW,
  JobStatus.FINAL_INTERVIEW,
] as const;

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.interview.findMany({
      where: { job: { company: { userId } } },
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
  }

  async createForJob(userId: string, jobId: string, dto: CreateInterviewDto) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, company: { userId } },
      select: { id: true, status: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const currentStatusIndex = interviewStatusOrder.indexOf(
      job.status as (typeof interviewStatusOrder)[number],
    );
    const targetStatusIndex = interviewStatusOrder.indexOf(
      dto.round as (typeof interviewStatusOrder)[number],
    );

    if (currentStatusIndex === -1 || targetStatusIndex <= currentStatusIndex) {
      throw new BadRequestException(
        'Interview round must be later than the current job status',
      );
    }

    const [interview] = await this.prisma.$transaction([
      this.prisma.interview.create({
        data: {
          jobId,
          round: dto.round,
          previousJobStatus: job.status,
          mode: dto.mode,
          scheduledAt: new Date(dto.scheduledAt),
          platform: dto.mode === 'ONLINE' ? dto.platform : null,
          meetingUrl: dto.mode === 'ONLINE' ? dto.meetingUrl : null,
          meetingId: dto.mode === 'ONLINE' ? dto.meetingId : null,
          meetingPassword: dto.mode === 'ONLINE' ? dto.meetingPassword : null,
          location: dto.mode === 'OFFLINE' ? dto.location : null,
          notes: dto.notes,
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
      }),
      this.prisma.job.update({
        where: { id: jobId },
        data: { status: dto.round },
      }),
      this.prisma.jobStatusHistory.create({
        data: {
          jobId,
          fromStatus: job.status,
          toStatus: dto.round,
          changeType: JobStatusChangeType.ADVANCE,
        },
      }),
    ]);

    return interview;
  }

  async undoForJob(userId: string, jobId: string, interviewId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        jobId,
        job: { company: { userId } },
      },
      include: { job: { select: { status: true } } },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    const latestInterview = await this.prisma.interview.findFirst({
      where: { jobId },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (
      latestInterview?.id !== interviewId ||
      !interview.previousJobStatus ||
      interview.job.status !== interview.round
    ) {
      throw new BadRequestException(
        'Only the latest interview status change can be undone',
      );
    }

    const [, job] = await this.prisma.$transaction([
      this.prisma.interview.delete({ where: { id: interviewId } }),
      this.prisma.job.update({
        where: { id: jobId },
        data: { status: interview.previousJobStatus },
      }),
      this.prisma.jobStatusHistory.create({
        data: {
          jobId,
          fromStatus: interview.round,
          toStatus: interview.previousJobStatus,
          changeType: JobStatusChangeType.UNDO,
          reason: 'Interview scheduling undone',
        },
      }),
    ]);

    return job;
  }
}
