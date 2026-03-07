import {
  Controller, Get, Post, Put, Patch, Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { SlaService } from './sla.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { AddTicketNoteDto } from './dto/add-ticket-note.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('tickets')
@ApiBearerAuth('access-token')
@Controller('tickets')
export class TicketsController {
  constructor(
    private ticketsService: TicketsService,
    private slaService: SlaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tickets' })
  findAll(@Query() query: TicketQueryDto, @CurrentUser() user: any) {
    return this.ticketsService.findAll(query, user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket statistics' })
  getStats(@CurrentUser() user: any) {
    return this.ticketsService.getStats(user);
  }

  @Get('sla/compliance')
  @ApiOperation({ summary: 'Get SLA compliance report' })
  getSlaCompliance(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.slaService.getSlaCompliance(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get('sla/resolution-time')
  @ApiOperation({ summary: 'Get average resolution time' })
  getResolutionTime(@Query('department') department?: string) {
    return this.slaService.getAverageResolutionTime(department);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new ticket' })
  create(@Body() dto: CreateTicketDto, @CurrentUser('id') userId: string) {
    return this.ticketsService.create(dto, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.updateStatus(id, status, userId, reason);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign ticket to agent' })
  assign(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.assign(id, assigneeId, userId);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add note to ticket' })
  addNote(
    @Param('id') id: string,
    @Body() dto: AddTicketNoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.addNote(id, dto, userId);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalate ticket' })
  escalate(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketsService.escalate(id, data, userId);
  }
}
