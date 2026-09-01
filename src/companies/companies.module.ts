import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CompaniesController } from './companies.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [CompaniesService],
  controllers: [CompaniesController],
})
export class CompaniesModule {}
