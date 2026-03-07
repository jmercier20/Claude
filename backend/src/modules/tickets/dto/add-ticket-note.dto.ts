import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteType } from '@prisma/client';

export class AddTicketNoteDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: NoteType })
  @IsOptional()
  @IsEnum(NoteType)
  type?: NoteType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  attachments?: any[];
}
