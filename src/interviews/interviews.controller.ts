import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { InterviewsService } from './interviews.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Controller()
@UseGuards(AccessTokenGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get('interviews')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.interviewsService.findAllForUser(user.sub);
  }

  @Post('jobs/:jobId/interviews')
  create(
    @Param('jobId') jobId: string,
    @Body() dto: CreateInterviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.interviewsService.createForJob(user.sub, jobId, dto);
  }

  @Delete('jobs/:jobId/interviews/:interviewId/undo')
  undo(
    @Param('jobId') jobId: string,
    @Param('interviewId') interviewId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.interviewsService.undoForJob(user.sub, jobId, interviewId);
  }
}
