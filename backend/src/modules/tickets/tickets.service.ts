import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SlaService } from './sla.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { AddTicketNoteDto } from './dto/add-ticket-note.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private slaService: SlaService,
    private notifications: NotificationsService,
  ) {}

  private generateTicketId(): string {
    const num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `TKT-${num}`;
  }

  async findAll(query: TicketQueryDto, user: any) {
    const {
      page = 1, limit = 20, search, status, priority, category,
      department, assigneeId, customerId, slaBreached, dateFrom, dateTo,
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    // Role-based filtering
    if (user.role === 'AGENT') {
      where.assigneeId = user.id;
    } else if (user.role === 'TECHNICAL' || user.role === 'CLAIMS' || user.role === 'FRAUD') {
      where.department = user.role;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { ticketId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = { in: Array.isArray(status) ? status : [status] };
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (department) where.department = department;
    if (assigneeId) where.assigneeId = assigneeId;
    if (customerId) where.customerId = customerId;
    if (slaBreached !== undefined) where.slaBreached = slaBreached === 'true';
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: { id: true, customerId: true, firstName: true, lastName: true, email: true },
          },
          assignee: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: { select: { notes: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketId: id }] },
      include: {
        customer: {
          select: {
            id: true, customerId: true, firstName: true, lastName: true,
            email: true, phone: true, status: true, riskLevel: true,
          },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, role: true, department: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        notes: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        slaEscalations: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async create(dto: CreateTicketDto, createdById: string) {
    // Generate unique ticket ID
    let ticketId: string;
    let isUnique = false;
    do {
      ticketId = this.generateTicketId();
      const existing = await this.prisma.ticket.findUnique({ where: { ticketId } });
      isUnique = !existing;
    } while (!isUnique);

    // Calculate SLA deadline
    const slaDeadline = await this.slaService.calculateDeadline(
      dto.priority,
      dto.category,
      dto.department,
    );

    // Auto-assign if no assignee specified
    let assigneeId = dto.assigneeId;
    if (!assigneeId) {
      assigneeId = await this.autoAssign(dto.category, dto.department);
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketId,
        customerId: dto.customerId,
        createdById,
        assigneeId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        department: dto.department,
        priority: dto.priority || 'MEDIUM',
        tags: dto.tags || [],
        metadata: dto.metadata as any,
        slaDeadline,
      },
      include: {
        customer: {
          select: { id: true, customerId: true, firstName: true, lastName: true, email: true },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Create status history entry
    await this.prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        toStatus: 'OPEN',
        changedById: createdById,
        reason: 'Ticket created',
      },
    });

    // Notify assignee
    if (assigneeId) {
      await this.notifications.createNotification({
        userId: assigneeId,
        type: 'TICKET_ASSIGNED',
        title: 'New Ticket Assigned',
        message: `Ticket ${ticketId} has been assigned to you`,
        data: { ticketId: ticket.id, ticketNumber: ticketId },
      });
    }

    // Update customer last activity
    await this.prisma.customer.update({
      where: { id: dto.customerId },
      data: { lastActivityAt: new Date() },
    });

    return ticket;
  }

  async updateStatus(id: string, status: string, userId: string, reason?: string) {
    const ticket = await this.findOne(id);

    const validTransitions: Record<string, string[]> = {
      OPEN: ['IN_PROGRESS', 'CLOSED'],
      IN_PROGRESS: ['PENDING_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'],
      PENDING_CUSTOMER: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      ESCALATED: ['IN_PROGRESS', 'RESOLVED'],
      RESOLVED: ['CLOSED', 'REOPENED'],
      CLOSED: ['REOPENED'],
      REOPENED: ['IN_PROGRESS', 'CLOSED'],
    };

    const allowedNext = validTransitions[ticket.status];
    if (!allowedNext?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${ticket.status} to ${status}`,
      );
    }

    const updateData: any = { status };

    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    } else if (status === 'CLOSED') {
      updateData.closedAt = new Date();
    } else if (status === 'REOPENED') {
      updateData.reopenedAt = new Date();
      updateData.reopenCount = { increment: 1 };
      updateData.status = 'REOPENED';
    }

    const [updatedTicket] = await Promise.all([
      this.prisma.ticket.update({
        where: { id: ticket.id },
        data: updateData,
      }),
      this.prisma.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: ticket.status as any,
          toStatus: status as any,
          changedById: userId,
          reason,
        },
      }),
    ]);

    // Notify customer-facing
    if (ticket.assigneeId) {
      await this.notifications.createNotification({
        userId: ticket.assigneeId,
        type: 'TICKET_UPDATED',
        title: 'Ticket Status Updated',
        message: `Ticket ${ticket.ticketId} status changed to ${status}`,
        data: { ticketId: ticket.id },
      });
    }

    return updatedTicket;
  }

  async assign(ticketId: string, assigneeId: string, userId: string) {
    const ticket = await this.findOne(ticketId);

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { assigneeId },
    });

    await this.notifications.createNotification({
      userId: assigneeId,
      type: 'TICKET_ASSIGNED',
      title: 'Ticket Assigned to You',
      message: `Ticket ${ticket.ticketId} has been assigned to you`,
      data: { ticketId: ticket.id },
    });

    return updatedTicket;
  }

  async addNote(ticketId: string, dto: AddTicketNoteDto, authorId: string) {
    const ticket = await this.findOne(ticketId);

    const note = await this.prisma.ticketNote.create({
      data: {
        ticketId: ticket.id,
        authorId,
        content: dto.content,
        type: dto.type || 'INTERNAL',
        attachments: dto.attachments as any || [],
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Update ticket updatedAt
    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date() },
    });

    return note;
  }

  async escalate(ticketId: string, data: any, userId: string) {
    const ticket = await this.findOne(ticketId);

    await Promise.all([
      this.prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'ESCALATED',
          escalationLevel: { increment: 1 },
        },
      }),
      this.prisma.slaEscalation.create({
        data: {
          ticketId: ticket.id,
          escalatedTo: data.escalateTo,
          level: (ticket.escalationLevel || 0) + 1,
          reason: data.reason,
        },
      }),
      this.prisma.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: ticket.status as any,
          toStatus: 'ESCALATED',
          changedById: userId,
          reason: data.reason,
        },
      }),
    ]);

    await this.notifications.createNotification({
      userId: data.escalateTo,
      type: 'ESCALATION',
      title: 'Ticket Escalated to You',
      message: `Ticket ${ticket.ticketId} has been escalated to you. Reason: ${data.reason}`,
      data: { ticketId: ticket.id },
    });

    return { message: 'Ticket escalated successfully' };
  }

  private async autoAssign(category: string, department: string): Promise<string | null> {
    const rule = await this.prisma.autoAssignmentRule.findFirst({
      where: {
        isActive: true,
        OR: [
          { category: category as any },
          { department: department as any },
        ],
      },
      orderBy: { priority_order: 'asc' },
    });

    if (rule?.assignToId) {
      return rule.assignToId;
    }

    // Find agent with least open tickets in the department
    const agent = await this.prisma.user.findFirst({
      where: {
        status: 'ACTIVE',
        department: department as any,
        role: { in: ['AGENT', 'TECHNICAL', 'CLAIMS', 'FRAUD'] },
      },
      orderBy: {
        assignedTickets: { _count: 'asc' },
      },
    });

    return agent?.id || null;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkSlaBreaches() {
    const breachedTickets = await this.prisma.ticket.findMany({
      where: {
        status: { notIn: ['RESOLVED', 'CLOSED'] },
        slaDeadline: { lt: new Date() },
        slaBreached: false,
      },
      select: { id: true, ticketId: true, assigneeId: true, slaDeadline: true },
    });

    for (const ticket of breachedTickets) {
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { slaBreached: true },
      });

      if (ticket.assigneeId) {
        await this.notifications.createNotification({
          userId: ticket.assigneeId,
          type: 'SLA_BREACH',
          title: 'SLA Breach Alert',
          message: `Ticket ${ticket.ticketId} has breached its SLA deadline`,
          data: { ticketId: ticket.id, slaDeadline: ticket.slaDeadline },
        });
      }
    }
  }

  async getStats(user: any) {
    const where: any = {};
    if (user.role === 'AGENT') where.assigneeId = user.id;

    const [
      total, open, inProgress, resolved, slaBreached,
      byPriority, byCategory, byDepartment,
    ] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'RESOLVED' } }),
      this.prisma.ticket.count({ where: { ...where, slaBreached: true, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      this.prisma.ticket.groupBy({ by: ['priority'], where, _count: true }),
      this.prisma.ticket.groupBy({ by: ['category'], where, _count: true }),
      this.prisma.ticket.groupBy({ by: ['department'], where, _count: true }),
    ]);

    return { total, open, inProgress, resolved, slaBreached, byPriority, byCategory, byDepartment };
  }
}
