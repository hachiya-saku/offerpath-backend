import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { normalizeCompanyName } from '../companies/company-name';
import { UpdateJobDto } from './dto/update-job.dto';
import { CorrectJobStatusDto } from './dto/correct-job-status.dto';
import { JobStatusChangeType } from '../../generated/prisma/enums';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(userId: string, dto: CreateJobDto) {
    let companyId: string;
    if (dto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: dto.companyId,
          userId,
        },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      companyId = company.id;
    } else if (dto.companyName) {
      const normalizedCompanyName = normalizeCompanyName(dto.companyName);

      let company = await this.prisma.company.findFirst({
        where: {
          normalizedName: normalizedCompanyName,
          userId,
        },
      });

      if (!company) {
        company = await this.prisma.company.create({
          data: {
            userId,
            name: dto.companyName,
            normalizedName: normalizedCompanyName,
          },
        });
      }

      companyId = company.id;
    } else {
      throw new BadRequestException(
        'Either companyId or companyName must be provided',
      );
    }

    return this.prisma.job.create({
      data: {
        companyId,
        positionName: dto.positionName,
        platform: dto.platform,
        location: dto.location,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
        salaryCurrency: dto.salaryCurrency,
        url: dto.url,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  findAllByUserId(userId: string) {
    return this.prisma.job.findMany({
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
  }

  async findOneByUserIdAndJobId(userId: string, jobId: string) {
    const result = await this.prisma.job.findFirst({
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

    if (!result) {
      throw new NotFoundException('Job not found');
    }

    return result;
  }

  async updateJobForUser(userId: string, jobId: string, dto: UpdateJobDto) {
    const { companyId, companyName, ...jobData } = dto;
    let finalCompanyId: string | undefined;

    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        company: { userId },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: companyId,
          userId,
        },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      finalCompanyId = companyId;
    } else if (companyName) {
      const normalizedCompanyName = normalizeCompanyName(companyName);

      let company = await this.prisma.company.findFirst({
        where: {
          normalizedName: normalizedCompanyName,
          userId,
        },
      });

      if (!company) {
        company = await this.prisma.company.create({
          data: {
            userId,
            name: companyName,
            normalizedName: normalizedCompanyName,
          },
        });
      }

      finalCompanyId = company.id;
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        ...jobData,
        companyId: finalCompanyId,
      },
    });
  }

  async deleteJobForUser(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        company: { userId },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.job.delete({
      where: { id: jobId },
    });
  }

  async correctStatusForUser(
    userId: string,
    jobId: string,
    dto: CorrectJobStatusDto,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, company: { userId } },
      select: { id: true, status: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status === dto.status) {
      throw new BadRequestException('Job already has the selected status');
    }

    const [updatedJob] = await this.prisma.$transaction([
      this.prisma.job.update({
        where: { id: jobId },
        data: { status: dto.status },
      }),
      this.prisma.jobStatusHistory.create({
        data: {
          jobId,
          fromStatus: job.status,
          toStatus: dto.status,
          changeType: JobStatusChangeType.CORRECTION,
          reason: dto.reason,
        },
      }),
    ]);

    return updatedJob;
  }

  async findStatusHistoryForUser(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, company: { userId } },
      select: { id: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobStatusHistory.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
