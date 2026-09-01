import {
  Controller,
  Get,
  Body,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@UseGuards(AccessTokenGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.companiesService.findAllByUserId(user.sub);
  }

  @Post()
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user: JwtPayload) {
    return this.companiesService.createForUser(user.sub, dto);
  }

  @Delete(':id')
  delete(@Param('id') companyId: string, @CurrentUser() user: JwtPayload) {
    return this.companiesService.deleteForUser(user.sub, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') companyId: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.companiesService.updateForUser(user.sub, companyId, dto);
  }
}
