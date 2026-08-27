import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { DEMO_USER_ID } from '../common/constants/demo-user';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.createForUser(DEMO_USER_ID, dto);
  }

  @Get()
  findAll() {
    return this.jobsService.findAllByUserId(DEMO_USER_ID);
  }

  @Get(':id')
  findOne(@Param('id') jobId: string) {
    return this.jobsService.findOneByUserIdAndJobId(DEMO_USER_ID, jobId);
  }

  @Patch(':id')
  update(@Param('id') jobId: string, @Body() dto: UpdateJobDto) {
    return this.jobsService.updateJobForUser(DEMO_USER_ID, jobId, dto);
  }
}
