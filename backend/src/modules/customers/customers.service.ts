import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { CreateCustomerNoteDto } from './dto/create-customer-note.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private generateCustomerId(): string {
    const num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `CUST-${num}`;
  }

  async findAll(query: CustomerQueryDto) {
    const { page = 1, limit = 20, search, status, riskLevel, segment, tags } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { customerId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (segment) where.segment = segment;
    if (tags?.length) where.tags = { hasSome: tags };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          customerId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          riskLevel: true,
          segment: true,
          tags: true,
          kycVerified: true,
          lastActivityAt: true,
          createdAt: true,
          _count: {
            select: {
              tickets: { where: { status: { not: 'CLOSED' } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { OR: [{ id }, { customerId: id }] },
      include: {
        tickets: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            ticketId: true,
            title: true,
            status: true,
            priority: true,
            category: true,
            createdAt: true,
          },
        },
        customerNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        interactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            agent: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        fraudFlags: {
          where: { isResolved: false },
        },
        _count: {
          select: {
            tickets: true,
            interactions: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Remove sensitive encrypted fields from response
    const { governmentId, ...safeCustomer } = customer;

    return safeCustomer;
  }

  async create(dto: CreateCustomerDto, createdById: string) {
    if (dto.email) {
      const existing = await this.prisma.customer.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException('Customer with this email already exists');
      }
    }

    // Generate unique customer ID
    let customerId: string;
    let isUnique = false;
    do {
      customerId = this.generateCustomerId();
      const existing = await this.prisma.customer.findUnique({ where: { customerId } });
      isUnique = !existing;
    } while (!isUnique);

    const customer = await this.prisma.customer.create({
      data: {
        customerId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        governmentIdType: dto.governmentIdType,
        nationality: dto.nationality,
        address: dto.address as any,
        status: 'ACTIVE',
        riskLevel: dto.riskLevel || 'LOW',
        segment: dto.segment || 'NEW',
        tags: dto.tags || [],
        notes: dto.notes,
        preferredLanguage: dto.preferredLanguage || 'en',
        createdById,
      },
    });

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.customer.findFirst({
        where: { email: dto.email.toLowerCase(), NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        email: dto.email?.toLowerCase(),
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async addNote(customerId: string, dto: CreateCustomerNoteDto, userId: string) {
    await this.findOne(customerId);

    return this.prisma.customerNote.create({
      data: {
        customerId,
        content: dto.content,
        type: dto.type || 'INTERNAL',
        isPinned: dto.isPinned || false,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  async flagFraud(customerId: string, data: any, flaggedById: string) {
    await this.findOne(customerId);

    const fraudFlag = await this.prisma.fraudFlag.create({
      data: {
        customerId,
        flaggedById,
        reason: data.reason,
        severity: data.severity || 'MEDIUM',
        evidence: data.evidence,
      },
    });

    // Update customer risk level
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { riskLevel: data.severity || 'HIGH' },
    });

    return fraudFlag;
  }

  async getTimeline(customerId: string) {
    await this.findOne(customerId);

    const [tickets, interactions, notes] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { customerId },
        select: {
          id: true, ticketId: true, title: true, status: true,
          priority: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.interaction.findMany({
        where: { customerId },
        include: {
          agent: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.customerNote.findMany({
        where: { customerId },
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const timeline = [
      ...tickets.map(t => ({ type: 'ticket', data: t, date: t.createdAt })),
      ...interactions.map(i => ({ type: 'interaction', data: i, date: i.createdAt })),
      ...notes.map(n => ({ type: 'note', data: n, date: n.createdAt })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return timeline;
  }

  async getStats() {
    const [total, byStatus, byRisk, bySegment, newThisMonth] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.customer.groupBy({ by: ['status'], _count: true }),
      this.prisma.customer.groupBy({ by: ['riskLevel'], _count: true }),
      this.prisma.customer.groupBy({ by: ['segment'], _count: true }),
      this.prisma.customer.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);

    return { total, byStatus, byRisk, bySegment, newThisMonth };
  }
}
