import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview' })
  getOverview(@CurrentUser() user: any) {
    return this.dashboardService.getOverview(user);
  }

  @Get('realtime')
  @ApiOperation({ summary: 'Get real-time statistics' })
  getRealtimeStats() {
    return this.dashboardService.getRealtimeStats();
  }

  @Get('risk-summary')
  @ApiOperation({ summary: 'Get risk summary' })
  getRiskSummary() {
    return this.dashboardService.getRiskSummary();
  }

  @Get('agent-performance')
  @ApiOperation({ summary: 'Get agent performance metrics' })
  getAgentPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.dashboardService.getAgentPerformance(dateFrom, dateTo);
  }
}
