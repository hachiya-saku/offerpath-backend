import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { CorrectJobStatusDto } from './dto/correct-job-status.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@UseGuards(AccessTokenGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() dto: CreateJobDto, @CurrentUser() user: JwtPayload) {
    return this.jobsService.createForUser(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.jobsService.findAllByUserId(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') jobId: string, @CurrentUser() user: JwtPayload) {
    return this.jobsService.findOneByUserIdAndJobId(user.sub, jobId);
  }

  @Patch(':id')
  update(
    @Param('id') jobId: string,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.jobsService.updateJobForUser(user.sub, jobId, dto);
  }

  @Patch(':id/status')
  correctStatus(
    @Param('id') jobId: string,
    @Body() dto: CorrectJobStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.jobsService.correctStatusForUser(user.sub, jobId, dto);
  }

  @Get(':id/status-history')
  findStatusHistory(
    @Param('id') jobId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.jobsService.findStatusHistoryForUser(user.sub, jobId);
  }

  @Delete(':id')
  delete(@Param('id') jobId: string, @CurrentUser() user: JwtPayload) {
    return this.jobsService.deleteJobForUser(user.sub, jobId);
  }
}
