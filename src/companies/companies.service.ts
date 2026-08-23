import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

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
}
