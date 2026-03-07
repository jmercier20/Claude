import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private generateEmployeeId(): string {
    const prefix = 'EMP';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}${random}`;
  }

  async findAll(query: UserQueryDto) {
    const {
      page = 1, limit = 20, search, role, status, department,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;
    if (department) where.department = department;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          employeeId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          department: true,
          phone: true,
          avatar: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              assignedTickets: { where: { status: { not: 'CLOSED' } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        department: true,
        phone: true,
        avatar: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            assignedTickets: true,
            createdTickets: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return user;
  }

  async create(dto: CreateUserDto, createdById: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password || 'TempPass123!', 12);

    const user = await this.prisma.user.create({
      data: {
        employeeId: this.generateEmployeeId(),
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        department: dto.department,
        phone: dto.phone,
        status: 'ACTIVE',
        mustChangePassword: !dto.password,
        createdById,
      },
      select: {
        id: true,
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        department: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, updatedById: string) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email.toLowerCase(), NOT: { id } },
      });

      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        email: dto.email?.toLowerCase(),
      },
      select: {
        id: true,
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        department: true,
        phone: true,
        updatedAt: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { status: status as any },
      select: { id: true, status: true },
    });
  }

  async resetPassword(id: string) {
    await this.findOne(id);

    const tempPassword = `Lisa${Math.random().toString(36).slice(-8)}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });

    return { tempPassword };
  }

  async getAgentStats(agentId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [openTickets, resolvedToday, totalInteractions] = await Promise.all([
      this.prisma.ticket.count({
        where: { assigneeId: agentId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.ticket.count({
        where: { assigneeId: agentId, resolvedAt: { gte: today } },
      }),
      this.prisma.interaction.count({
        where: { agentId, createdAt: { gte: today } },
      }),
    ]);

    return { openTickets, resolvedToday, totalInteractions };
  }
}
