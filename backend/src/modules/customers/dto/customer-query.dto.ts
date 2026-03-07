import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus, RiskLevel, CustomerSegment } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CustomerQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: CustomerStatus }) @IsOptional() @IsEnum(CustomerStatus) status?: CustomerStatus;
  @ApiPropertyOptional({ enum: RiskLevel }) @IsOptional() @IsEnum(RiskLevel) riskLevel?: RiskLevel;
  @ApiPropertyOptional({ enum: CustomerSegment }) @IsOptional() @IsEnum(CustomerSegment) segment?: CustomerSegment;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => typeof value === 'string' ? value.split(',') : value)
  tags?: string[];
}
