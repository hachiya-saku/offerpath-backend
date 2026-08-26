import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { normalizeCompanyName } from '../companies/company-name';

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
}
