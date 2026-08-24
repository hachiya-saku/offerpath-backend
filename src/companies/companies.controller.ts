import { Controller, Get, Body, Post } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { DEMO_USER_ID } from '../common/constants/demo-user';
import { CreateCompanyDto } from './dto/create-company.dto';

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
}
