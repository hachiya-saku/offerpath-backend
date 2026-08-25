import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(userId: string, dto: CreateJobDto) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: dto.companyId,
        userId,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.job.create({
      data: {
        companyId: dto.companyId,
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
}
