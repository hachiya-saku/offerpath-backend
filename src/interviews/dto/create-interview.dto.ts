import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { InterviewMode, JobStatus } from '../../../generated/prisma/enums';

const interviewRounds = [
  JobStatus.FIRST_INTERVIEW,
  JobStatus.SECOND_INTERVIEW,
  JobStatus.THIRD_INTERVIEW,
  JobStatus.FINAL_INTERVIEW,
] as const;

export class CreateInterviewDto {
  @IsIn(interviewRounds)
  round!: JobStatus;

  @IsEnum(InterviewMode)
  mode!: InterviewMode;

  @IsDateString()
  scheduledAt!: string;

  @ValidateIf((dto: CreateInterviewDto) => dto.mode === InterviewMode.ONLINE)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  platform?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  meetingId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  meetingPassword?: string;

  @ValidateIf((dto: CreateInterviewDto) => dto.mode === InterviewMode.OFFLINE)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
