import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create SLA Policies
  const slaPolicies = [
    { name: 'Critical Response', priority: 'CRITICAL', responseTimeHrs: 1, resolutionTimeHrs: 4 },
    { name: 'Urgent Response', priority: 'URGENT', responseTimeHrs: 2, resolutionTimeHrs: 8 },
    { name: 'High Priority', priority: 'HIGH', responseTimeHrs: 4, resolutionTimeHrs: 24 },
    { name: 'Medium Priority', priority: 'MEDIUM', responseTimeHrs: 8, resolutionTimeHrs: 48 },
    { name: 'Low Priority', priority: 'LOW', responseTimeHrs: 24, resolutionTimeHrs: 72 },
  ];

  for (const policy of slaPolicies) {
    await prisma.slaPolicy.upsert({
      where: { name: policy.name },
      update: {},
      create: policy as any,
    });
  }

  console.log('✅ SLA Policies created');

  // Create Admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lisa-crm.com' },
    update: {},
    create: {
      employeeId: 'EMP-000001',
      email: 'admin@lisa-crm.com',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create Supervisor
  const supervisorPassword = await bcrypt.hash('Super@123456', 12);
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@lisa-crm.com' },
    update: {},
    create: {
      employeeId: 'EMP-000002',
      email: 'supervisor@lisa-crm.com',
      passwordHash: supervisorPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'SUPERVISOR',
      department: 'GENERAL',
      status: 'ACTIVE',
    },
  });

  // Create Agents
  const agentPassword = await bcrypt.hash('Agent@123456', 12);

  const agents = [
    { email: 'agent1@lisa-crm.com', firstName: 'John', lastName: 'Doe', department: 'GENERAL', employeeId: 'EMP-000003' },
    { email: 'agent2@lisa-crm.com', firstName: 'Sarah', lastName: 'Johnson', department: 'TECHNICAL', employeeId: 'EMP-000004', role: 'TECHNICAL' },
    { email: 'agent3@lisa-crm.com', firstName: 'Mike', lastName: 'Williams', department: 'CLAIMS', employeeId: 'EMP-000005', role: 'CLAIMS' },
    { email: 'agent4@lisa-crm.com', firstName: 'Lisa', lastName: 'Brown', department: 'FRAUD', employeeId: 'EMP-000006', role: 'FRAUD' },
  ];

  const createdAgents = [];
  for (const agentData of agents) {
    const agent = await prisma.user.upsert({
      where: { email: agentData.email },
      update: {},
      create: {
        ...agentData,
        passwordHash: agentPassword,
        role: (agentData.role || 'AGENT') as any,
        status: 'ACTIVE',
      },
    });
    createdAgents.push(agent);
  }

  console.log('✅ Users created');

  // Create sample customers
  const customers = [
    {
      customerId: 'CUST-000001',
      firstName: 'Alice',
      lastName: 'Thompson',
      email: 'alice.thompson@example.com',
      phone: '+1-555-0101',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      segment: 'HVC',
      tags: ['vip', 'high-value'],
      kycVerified: true,
      lifetimeValue: 50000,
    },
    {
      customerId: 'CUST-000002',
      firstName: 'Bob',
      lastName: 'Martinez',
      email: 'bob.martinez@example.com',
      phone: '+1-555-0102',
      status: 'ACTIVE',
      riskLevel: 'MEDIUM',
      segment: 'MVC',
      tags: ['regular'],
      kycVerified: true,
      lifetimeValue: 15000,
    },
    {
      customerId: 'CUST-000003',
      firstName: 'Carol',
      lastName: 'Davis',
      email: 'carol.davis@example.com',
      phone: '+1-555-0103',
      status: 'ACTIVE',
      riskLevel: 'HIGH',
      segment: 'AT_RISK',
      tags: ['at-risk', 'review-needed'],
      kycVerified: false,
      lifetimeValue: 3000,
    },
    {
      customerId: 'CUST-000004',
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@example.com',
      phone: '+1-555-0104',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      segment: 'NEW',
      tags: ['new'],
      kycVerified: false,
    },
    {
      customerId: 'CUST-000005',
      firstName: 'Emma',
      lastName: 'Garcia',
      email: 'emma.garcia@example.com',
      phone: '+1-555-0105',
      status: 'SUSPENDED',
      riskLevel: 'CRITICAL',
      segment: 'AT_RISK',
      tags: ['suspended', 'fraud-review'],
      kycVerified: true,
      lifetimeValue: 8000,
    },
  ];

  const createdCustomers = [];
  for (const customerData of customers) {
    const existing = await prisma.customer.findUnique({ where: { customerId: customerData.customerId } });
    if (!existing) {
      const customer = await prisma.customer.create({
        data: {
          ...customerData,
          createdById: admin.id,
          lifetimeValue: customerData.lifetimeValue as any,
        } as any,
      });
      createdCustomers.push(customer);
    } else {
      createdCustomers.push(existing);
    }
  }

  console.log('✅ Customers created');

  // Create sample tickets
  const ticketData = [
    {
      title: 'Unable to withdraw funds',
      description: 'Customer reports being unable to withdraw their balance since yesterday',
      category: 'CLAIMS',
      department: 'CLAIMS',
      priority: 'HIGH',
      status: 'OPEN',
    },
    {
      title: 'Account login issues',
      description: 'Customer unable to log into their account after password reset',
      category: 'TECHNICAL',
      department: 'TECHNICAL',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
    },
    {
      title: 'Suspected fraudulent activity',
      description: 'Multiple failed login attempts from different IPs detected',
      category: 'FRAUD',
      department: 'FRAUD',
      priority: 'CRITICAL',
      status: 'ESCALATED',
    },
    {
      title: 'Billing discrepancy',
      description: 'Customer reports incorrect charges on their account',
      category: 'BILLING',
      department: 'CLAIMS',
      priority: 'MEDIUM',
      status: 'OPEN',
    },
    {
      title: 'General inquiry about promotions',
      description: 'Customer asking about current promotional offers',
      category: 'GENERAL',
      department: 'GENERAL',
      priority: 'LOW',
      status: 'RESOLVED',
    },
  ];

  for (let i = 0; i < ticketData.length; i++) {
    const td = ticketData[i];
    const customer = createdCustomers[i % createdCustomers.length];
    const agent = createdAgents[i % createdAgents.length];
    const ticketId = `TKT-${String(i + 1).padStart(6, '0')}`;

    const existing = await prisma.ticket.findUnique({ where: { ticketId } });
    if (!existing) {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + (td.priority === 'CRITICAL' ? 4 : td.priority === 'HIGH' ? 24 : 48));

      await prisma.ticket.create({
        data: {
          ticketId,
          customerId: customer.id,
          createdById: admin.id,
          assigneeId: agent.id,
          title: td.title,
          description: td.description,
          category: td.category as any,
          department: td.department as any,
          priority: td.priority as any,
          status: td.status as any,
          slaDeadline: deadline,
          resolvedAt: td.status === 'RESOLVED' ? new Date() : undefined,
        },
      });
    }
  }

  console.log('✅ Tickets created');

  // System settings
  const settings = [
    { key: 'company_name', value: 'LISA CRM', description: 'Company name' },
    { key: 'default_sla_hours', value: '48', description: 'Default SLA hours' },
    { key: 'max_escalation_level', value: '3', description: 'Maximum escalation levels' },
    { key: 'notification_email', value: 'noreply@lisa-crm.com', description: 'System notification email' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ System settings created');
  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin:      admin@lisa-crm.com / Admin@123456');
  console.log('  Supervisor: supervisor@lisa-crm.com / Super@123456');
  console.log('  Agent:      agent1@lisa-crm.com / Agent@123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
