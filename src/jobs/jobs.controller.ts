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
import { DEMO_USER_ID } from '../common/constants/demo-user';
import { CreateJobDto } from './dto/create-job.dto';
import { CorrectJobStatusDto } from './dto/correct-job-status.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.createForUser(DEMO_USER_ID, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.jobsService.findAllByUserId(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') jobId: string) {
    return this.jobsService.findOneByUserIdAndJobId(DEMO_USER_ID, jobId);
  }

  @Patch(':id')
  update(@Param('id') jobId: string, @Body() dto: UpdateJobDto) {
    return this.jobsService.updateJobForUser(DEMO_USER_ID, jobId, dto);
  }

  @Patch(':id/status')
  correctStatus(@Param('id') jobId: string, @Body() dto: CorrectJobStatusDto) {
    return this.jobsService.correctStatusForUser(DEMO_USER_ID, jobId, dto);
  }

  @Get(':id/status-history')
  findStatusHistory(@Param('id') jobId: string) {
    return this.jobsService.findStatusHistoryForUser(DEMO_USER_ID, jobId);
  }

  @Delete(':id')
  delete(@Param('id') jobId: string) {
    return this.jobsService.deleteJobForUser(DEMO_USER_ID, jobId);
  }
}
