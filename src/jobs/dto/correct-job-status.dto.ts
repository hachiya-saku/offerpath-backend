import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { JobStatus } from '../../../generated/prisma/enums';

export class CorrectJobStatusDto {
  @IsEnum(JobStatus)
  status!: JobStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
