import { IsString, IsEmail, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus, RiskLevel, CustomerSegment } from '@prisma/client';

export class UpdateCustomerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() alternatePhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nationality?: string;
  @ApiPropertyOptional() @IsOptional() address?: any;
  @ApiPropertyOptional({ enum: CustomerStatus }) @IsOptional() @IsEnum(CustomerStatus) status?: CustomerStatus;
  @ApiPropertyOptional({ enum: RiskLevel }) @IsOptional() @IsEnum(RiskLevel) riskLevel?: RiskLevel;
  @ApiPropertyOptional({ enum: CustomerSegment }) @IsOptional() @IsEnum(CustomerSegment) segment?: CustomerSegment;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() kycVerified?: boolean;
}
