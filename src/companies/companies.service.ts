import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUserId(userId: string) {
    return this.prisma.company.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  createForUser(userId: string, dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        userId,
        name: dto.name,
        website: dto.website,
        notes: dto.notes,
      },
    });
  }

  async updateForUser(
    userId: string,
    companyId: string,
    dto: UpdateCompanyDto,
  ) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        name: dto.name,
        website: dto.website,
        notes: dto.notes,
      },
    });
  }

  async deleteForUser(userId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.delete({
      where: { id: companyId },
    });
  }
}
