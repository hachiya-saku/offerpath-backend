import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { DEMO_USER_ID } from '../common/constants/demo-user';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { InterviewsService } from './interviews.service';

@Controller()
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get('interviews')
  findAll() {
    return this.interviewsService.findAllForUser(DEMO_USER_ID);
  }

  @Post('jobs/:jobId/interviews')
  create(@Param('jobId') jobId: string, @Body() dto: CreateInterviewDto) {
    return this.interviewsService.createForJob(DEMO_USER_ID, jobId, dto);
  }

  @Delete('jobs/:jobId/interviews/:interviewId/undo')
  undo(
    @Param('jobId') jobId: string,
    @Param('interviewId') interviewId: string,
  ) {
    return this.interviewsService.undoForJob(DEMO_USER_ID, jobId, interviewId);
  }
}
