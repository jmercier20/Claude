import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../config/redis.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getOverview(user: any) {
    const cacheKey = `dashboard:overview:${user.role}:${user.id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const ticketWhere: any = {};
    if (user.role === 'AGENT') ticketWhere.assigneeId = user.id;

    const [
      totalTickets,
      openTickets,
      resolvedToday,
      slaBreached,
      totalCustomers,
      newCustomersThisMonth,
      newCustomersLastMonth,
      avgResolutionTime,
      ticketsByDepartment,
      ticketsByPriority,
      ticketTrend,
      topAgents,
    ] = await Promise.all([
      this.prisma.ticket.count({ where: ticketWhere }),
      this.prisma.ticket.count({ where: { ...ticketWhere, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.ticket.count({ where: { ...ticketWhere, resolvedAt: { gte: today } } }),
      this.prisma.ticket.count({ where: { ...ticketWhere, slaBreached: true, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.customer.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
      this.getAvgResolutionHours(),
      this.prisma.ticket.groupBy({ by: ['department'], where: { ...ticketWhere, status: { notIn: ['CLOSED'] } }, _count: true }),
      this.prisma.ticket.groupBy({ by: ['priority'], where: { ...ticketWhere, status: { notIn: ['CLOSED'] } }, _count: true }),
      this.getTicketTrend(),
      this.getTopAgents(),
    ]);

    const data = {
      tickets: {
        total: totalTickets,
        open: openTickets,
        resolvedToday,
        slaBreached,
        avgResolutionHours: avgResolutionTime,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomersThisMonth,
        newLastMonth: newCustomersLastMonth,
        growth: newCustomersLastMonth > 0
          ? Math.round(((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100)
          : 100,
      },
      byDepartment: ticketsByDepartment,
      byPriority: ticketsByPriority,
      ticketTrend,
      topAgents,
    };

    await this.redis.set(cacheKey, JSON.stringify(data), 60); // cache for 1 minute

    return data;
  }

  private async getAvgResolutionHours(): Promise<number> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        resolvedAt: { gte: last30Days, not: null },
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
      select: { createdAt: true, resolvedAt: true },
    });

    if (!tickets.length) return 0;

    const total = tickets.reduce((sum, t) => {
      return sum + (t.resolvedAt!.getTime() - t.createdAt.getTime());
    }, 0);

    return Math.round(total / tickets.length / (1000 * 60 * 60) * 10) / 10;
  }

  private async getTicketTrend() {
    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tickets = await this.prisma.ticket.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      byDay[date.toISOString().split('T')[0]] = 0;
    }

    for (const ticket of tickets) {
      const day = ticket.createdAt.toISOString().split('T')[0];
      if (byDay[day] !== undefined) {
        byDay[day] += ticket._count;
      }
    }

    return Object.entries(byDay).map(([date, count]) => ({ date, count }));
  }

  private async getTopAgents() {
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const agents = await this.prisma.user.findMany({
      where: { role: { in: ['AGENT', 'TECHNICAL', 'CLAIMS', 'FRAUD'] }, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        _count: {
          select: {
            assignedTickets: {
              where: { resolvedAt: { gte: thisMonth } },
            },
          },
        },
      },
      orderBy: { assignedTickets: { _count: 'desc' } },
      take: 10,
    });

    return agents.map(a => ({
      id: a.id,
      name: `${a.firstName} ${a.lastName}`,
      role: a.role,
      resolvedThisMonth: a._count.assignedTickets,
    }));
  }

  async getRealtimeStats() {
    const [
      onlineAgents,
      ticketsCreatedLastHour,
      pendingTickets,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.ticket.count({
        where: { createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      }),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
    ]);

    return { onlineAgents, ticketsCreatedLastHour, pendingTickets, timestamp: new Date() };
  }

  async getRiskSummary() {
    const [highRiskCustomers, fraudFlags, criticalTickets] = await Promise.all([
      this.prisma.customer.count({ where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } } }),
      this.prisma.fraudFlag.count({ where: { isResolved: false } }),
      this.prisma.ticket.count({ where: { priority: 'CRITICAL', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    ]);

    return { highRiskCustomers, fraudFlags, criticalTickets };
  }

  async getAgentPerformance(dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().setDate(new Date().getDate() - 30));
    const to = dateTo ? new Date(dateTo) : new Date();

    const agents = await this.prisma.user.findMany({
      where: { role: { in: ['AGENT', 'TECHNICAL', 'CLAIMS', 'FRAUD'] }, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true,
        assignedTickets: {
          where: { createdAt: { gte: from, lte: to } },
          select: {
            status: true,
            priority: true,
            slaBreached: true,
            resolvedAt: true,
            createdAt: true,
          },
        },
        interactions: {
          where: { createdAt: { gte: from, lte: to } },
          select: { duration: true, satisfactionScore: true },
        },
      },
    });

    return agents.map((agent) => {
      const tickets = agent.assignedTickets;
      const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
      const slaBreached = tickets.filter(t => t.slaBreached);
      const avgScore = agent.interactions.length > 0
        ? agent.interactions.reduce((sum, i) => sum + (i.satisfactionScore || 0), 0) / agent.interactions.length
        : null;

      return {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        department: agent.department,
        totalTickets: tickets.length,
        resolved: resolved.length,
        slaBreached: slaBreached.length,
        slaCompliance: tickets.length > 0
          ? Math.round(((tickets.length - slaBreached.length) / tickets.length) * 100)
          : 100,
        interactions: agent.interactions.length,
        avgSatisfactionScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
      };
    }).sort((a, b) => b.resolved - a.resolved);
  }
}
