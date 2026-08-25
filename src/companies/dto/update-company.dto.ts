import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class UpdateCompanyDto {
  @IsString()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsString()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  @IsOptional()
  website?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string;
}
