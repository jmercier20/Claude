// ============================================================
// ENUMS
// ============================================================

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'AGENT' | 'TECHNICAL' | 'CLAIMS' | 'FRAUD' | 'EXECUTIVE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'VIP';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CustomerSegment = 'HVC' | 'MVC' | 'LVC' | 'NEW' | 'AT_RISK' | 'CHURNED';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_CUSTOMER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type TicketCategory = 'TECHNICAL' | 'CLAIMS' | 'FRAUD' | 'BILLING' | 'ACCOUNT' | 'GENERAL' | 'COMPLAINT' | 'FEEDBACK';
export type Department = 'TECHNICAL' | 'CLAIMS' | 'FRAUD' | 'BILLING' | 'GENERAL' | 'MANAGEMENT' | 'COMPLIANCE';
export type NoteType = 'INTERNAL' | 'EXTERNAL' | 'SYSTEM';

// ============================================================
// API RESPONSE
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// USER
// ============================================================

export interface User {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  department?: Department;
  phone?: string;
  avatar?: string;
  lastLoginAt?: string;
  mustChangePassword: boolean;
  createdAt: string;
}

// ============================================================
// CUSTOMER
// ============================================================

export interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  governmentIdType?: string;
  nationality?: string;
  address?: Address;
  status: CustomerStatus;
  riskLevel: RiskLevel;
  segment: CustomerSegment;
  tags: string[];
  notes?: string;
  preferredLanguage?: string;
  totalDeposits?: number;
  totalWithdrawals?: number;
  lifetimeValue?: number;
  lastActivityAt?: string;
  kycVerified: boolean;
  kycVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tickets: number;
    interactions: number;
  };
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  type: NoteType;
  isPinned: boolean;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
}

// ============================================================
// TICKET
// ============================================================

export interface Ticket {
  id: string;
  ticketId: string;
  customerId: string;
  assigneeId?: string;
  createdById: string;
  title: string;
  description: string;
  category: TicketCategory;
  department: Department;
  priority: TicketPriority;
  status: TicketStatus;
  tags: string[];
  slaDeadline?: string;
  slaBreached: boolean;
  resolvedAt?: string;
  closedAt?: string;
  reopenCount: number;
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
  customer?: Partial<Customer>;
  assignee?: Partial<User>;
  createdBy?: Partial<User>;
  notes?: TicketNote[];
  statusHistory?: TicketStatusHistory[];
  _count?: { notes: number };
}

export interface TicketNote {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  type: NoteType;
  attachments: any[];
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; role: string };
}

export interface TicketStatusHistory {
  id: string;
  ticketId: string;
  fromStatus?: TicketStatus;
  toStatus: TicketStatus;
  changedById: string;
  reason?: string;
  createdAt: string;
}

// ============================================================
// DASHBOARD
// ============================================================

export interface DashboardOverview {
  tickets: {
    total: number;
    open: number;
    resolvedToday: number;
    slaBreached: number;
    avgResolutionHours: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    newLastMonth: number;
    growth: number;
  };
  byDepartment: Array<{ department: string; _count: number }>;
  byPriority: Array<{ priority: string; _count: number }>;
  ticketTrend: Array<{ date: string; count: number }>;
  topAgents: Array<{
    id: string;
    name: string;
    role: string;
    resolvedThisMonth: number;
  }>;
}

// ============================================================
// NOTIFICATION
// ============================================================

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
