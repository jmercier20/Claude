import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getTicketReport(params: any) {
    const { dateFrom, dateTo, department, category, groupBy = 'day' } = params;

    const where: any = {};
    if (department) where.department = department;
    if (category) where.category = category;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [
      summary,
      byStatus,
      byPriority,
      byCategory,
      byDepartment,
      slaStats,
    ] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.ticket.groupBy({ by: ['priority'], where, _count: true }),
      this.prisma.ticket.groupBy({ by: ['category'], where, _count: true }),
      this.prisma.ticket.groupBy({ by: ['department'], where, _count: true }),
      this.getSlaStats(where),
    ]);

    return { summary, byStatus, byPriority, byCategory, byDepartment, slaStats };
  }

  private async getSlaStats(where: any) {
    const [total, breached] = await Promise.all([
      this.prisma.ticket.count({ where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } } }),
      this.prisma.ticket.count({ where: { ...where, slaBreached: true } }),
    ]);

    return {
      total,
      breached,
      met: total - breached,
      complianceRate: total > 0 ? Math.round(((total - breached) / total) * 100) : 100,
    };
  }

  async getCustomerReport(params: any) {
    const { dateFrom, dateTo } = params;

    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [total, byStatus, byRisk, bySegment, withFraudFlags] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.customer.groupBy({ by: ['riskLevel'], where, _count: true }),
      this.prisma.customer.groupBy({ by: ['segment'], where, _count: true }),
      this.prisma.fraudFlag.count({ where: { isResolved: false } }),
    ]);

    return { total, byStatus, byRisk, bySegment, withFraudFlags };
  }

  async getAgentReport(params: any) {
    const { dateFrom, dateTo, agentId } = params;

    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().setDate(new Date().getDate() - 30));
    const to = dateTo ? new Date(dateTo) : new Date();

    const where: any = {
      role: { in: ['AGENT', 'TECHNICAL', 'CLAIMS', 'FRAUD'] },
      status: 'ACTIVE',
    };

    if (agentId) where.id = agentId;

    const agents = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        assignedTickets: {
          where: { createdAt: { gte: from, lte: to } },
          select: { status: true, slaBreached: true, resolvedAt: true, priority: true },
        },
        interactions: {
          where: { createdAt: { gte: from, lte: to } },
          select: { duration: true, satisfactionScore: true, type: true },
        },
      },
    });

    return agents.map((agent) => {
      const tickets = agent.assignedTickets;
      const resolved = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status));

      return {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        department: agent.department,
        role: agent.role,
        totalTickets: tickets.length,
        resolvedTickets: resolved.length,
        slaBreaches: tickets.filter(t => t.slaBreached).length,
        resolutionRate: tickets.length > 0 ? Math.round((resolved.length / tickets.length) * 100) : 0,
        totalInteractions: agent.interactions.length,
        avgCallDuration: agent.interactions.length > 0
          ? Math.round(agent.interactions.reduce((s, i) => s + (i.duration || 0), 0) / agent.interactions.length)
          : 0,
        avgSatisfaction: agent.interactions.filter(i => i.satisfactionScore).length > 0
          ? Math.round(
              agent.interactions.filter(i => i.satisfactionScore)
                .reduce((s, i) => s + i.satisfactionScore!, 0) /
              agent.interactions.filter(i => i.satisfactionScore).length * 10
            ) / 10
          : null,
      };
    });
  }
}
