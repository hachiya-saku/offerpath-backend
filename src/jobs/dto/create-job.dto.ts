import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { JobStatus } from '../../../generated/prisma/enums';

export class CreateJobDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  positionName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  platform!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  salaryCurrency?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  url?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
