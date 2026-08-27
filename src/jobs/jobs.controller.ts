import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { DEMO_USER_ID } from '../common/constants/demo-user';
import { CreateJobDto } from './dto/create-job.dto';
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
}
