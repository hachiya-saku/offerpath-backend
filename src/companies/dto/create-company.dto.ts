import {
  IsNotEmpty,
  IsString,
  IsUrl,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
