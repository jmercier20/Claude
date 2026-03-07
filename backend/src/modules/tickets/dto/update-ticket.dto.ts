import { IsString, IsEnum, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketCategory, TicketPriority, Department, TicketStatus } from '@prisma/client';

export class UpdateTicketDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: TicketCategory }) @IsOptional() @IsEnum(TicketCategory) category?: TicketCategory;
  @ApiPropertyOptional({ enum: Department }) @IsOptional() @IsEnum(Department) department?: Department;
  @ApiPropertyOptional({ enum: TicketPriority }) @IsOptional() @IsEnum(TicketPriority) priority?: TicketPriority;
  @ApiPropertyOptional({ enum: TicketStatus }) @IsOptional() @IsEnum(TicketStatus) status?: TicketStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigneeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() resolutionNotes?: string;
}
