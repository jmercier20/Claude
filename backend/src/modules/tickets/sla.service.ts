import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const DEFAULT_SLA_HOURS: Record<string, number> = {
  CRITICAL: 4,
  URGENT: 8,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72,
};

@Injectable()
export class SlaService {
  constructor(private prisma: PrismaService) {}

  async calculateDeadline(
    priority: string,
    category?: string,
    department?: string,
  ): Promise<Date> {
    // Try to find a matching SLA policy
    const policy = await this.prisma.slaPolicy.findFirst({
      where: {
        isActive: true,
        priority: priority as any,
        OR: [
          { category: category as any },
          { department: department as any },
          { category: null, department: null },
        ],
      },
      orderBy: { resolutionTimeHrs: 'asc' },
    });

    const hours = policy?.resolutionTimeHrs || DEFAULT_SLA_HOURS[priority] || 48;

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);

    return deadline;
  }

  async getSlaCompliance(dateFrom?: Date, dateTo?: Date) {
    const where: any = {
      status: { in: ['RESOLVED', 'CLOSED'] },
    };

    if (dateFrom || dateTo) {
      where.resolvedAt = {};
      if (dateFrom) where.resolvedAt.gte = dateFrom;
      if (dateTo) where.resolvedAt.lte = dateTo;
    }

    const [total, breached] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, slaBreached: true } }),
    ]);

    const compliance = total > 0 ? ((total - breached) / total) * 100 : 100;

    return {
      total,
      breached,
      met: total - breached,
      complianceRate: Math.round(compliance * 100) / 100,
    };
  }

  async getAverageResolutionTime(department?: string) {
    const where: any = {
      status: { in: ['RESOLVED', 'CLOSED'] },
      resolvedAt: { not: null },
    };

    if (department) where.department = department;

    const tickets = await this.prisma.ticket.findMany({
      where,
      select: { createdAt: true, resolvedAt: true, priority: true },
    });

    if (!tickets.length) return { average: 0, byPriority: {} };

    const byPriority: Record<string, number[]> = {};

    const times = tickets.map((t) => {
      const hrs = (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      if (!byPriority[t.priority]) byPriority[t.priority] = [];
      byPriority[t.priority].push(hrs);
      return hrs;
    });

    const average = times.reduce((sum, t) => sum + t, 0) / times.length;

    const byPriorityAvg: Record<string, number> = {};
    for (const [priority, pTimes] of Object.entries(byPriority)) {
      byPriorityAvg[priority] = pTimes.reduce((s, t) => s + t, 0) / pTimes.length;
    }

    return {
      average: Math.round(average * 100) / 100,
      byPriority: byPriorityAvg,
    };
  }
}
