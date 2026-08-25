import {
  Controller,
  Get,
  Body,
  Post,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { DEMO_USER_ID } from '../common/constants/demo-user';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAllByUserId(DEMO_USER_ID);
  }

  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.createForUser(DEMO_USER_ID, dto);
  }

  @Delete(':id')
  delete(@Param('id') companyId: string) {
    return this.companiesService.deleteForUser(DEMO_USER_ID, companyId);
  }

  @Patch(':id')
  update(@Param('id') companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateForUser(DEMO_USER_ID, companyId, dto);
  }
}
