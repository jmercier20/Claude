import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Ticket report' })
  getTicketReport(@Query() params: any) {
    return this.reportsService.getTicketReport(params);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Customer report' })
  getCustomerReport(@Query() params: any) {
    return this.reportsService.getCustomerReport(params);
  }

  @Get('agents')
  @ApiOperation({ summary: 'Agent performance report' })
  getAgentReport(@Query() params: any) {
    return this.reportsService.getAgentReport(params);
  }
}
