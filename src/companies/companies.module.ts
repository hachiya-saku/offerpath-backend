import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [PrismaModule],
  providers: [CompaniesService],
  controllers: [CompaniesController],
})
export class CompaniesModule {}
