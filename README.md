# LISA CRM - Customer Relationship Management System

> Enterprise-grade CRM platform for Lottery & Gaming companies

## Overview

LISA CRM is a full-stack, cloud-native Customer Relationship Management system designed for high-volume lottery and gaming operations. It provides comprehensive tools for managing customer profiles, support tickets, call center interactions, fraud detection, and analytics.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LISA CRM Platform                        │
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   Next.js    │    │     NestJS API   │    │  PostgreSQL   │  │
│  │   Frontend   │◄──►│    (Port 3001)   │◄──►│   Database    │  │
│  │  (Port 3000) │    │                  │    │  (Port 5432)  │  │
│  └──────────────┘    │  - Auth Module   │    └───────────────┘  │
│                      │  - Users Module  │                        │
│  ┌──────────────┐    │  - Customers     │    ┌───────────────┐  │
│  │    Nginx     │    │  - Tickets       │◄──►│     Redis     │  │
│  │  Reverse     │    │  - Dashboard     │    │  (Port 6379)  │  │
│  │   Proxy      │    │  - Reports       │    └───────────────┘  │
│  │  (Port 80)   │    │  - WebSockets    │                        │
│  └──────────────┘    └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, Radix UI, shadcn/ui |
| State Management | Zustand, TanStack Query |
| Charts | Recharts |
| Backend | NestJS (Node.js), TypeScript |
| API | REST + WebSockets (Socket.io) |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens) |
| Containerization | Docker + Docker Compose |
| Documentation | Swagger/OpenAPI |

---

## Features

### Phase 1 - Core Modules

#### Authentication & Security
- JWT-based authentication with refresh tokens
- Role-Based Access Control (RBAC)
- Account lockout after failed attempts
- Password policies (complexity, expiry)
- Audit logging for all actions
- IP tracking for admin access
- Bcrypt password hashing

#### User Management
- 7 role types: Admin, Supervisor, Agent, Technical, Claims, Fraud, Executive
- Department assignment
- Activity tracking
- Password reset
- Status management

#### Customer Management
- Unique Customer IDs (CUST-XXXXXX format)
- Full profile with PII encryption
- KYC verification tracking
- Risk classification (Low/Medium/High/Critical)
- Customer segmentation (HVC, MVC, LVC, New, At-Risk, Churned)
- Tag-based organization
- Complete activity timeline
- Fraud flagging system
- Linked tickets and interaction history

#### Ticketing System
- Auto-generated Ticket IDs (TKT-XXXXXX)
- Full lifecycle management (Open → In Progress → Resolved → Closed)
- 5 priority levels (Low, Medium, High, Urgent, Critical)
- Department routing (Technical, Claims, Fraud, Billing, General)
- SLA tracking with configurable policies
- Automated SLA breach detection & alerts
- Auto-assignment rules
- Multi-level escalation
- Internal/external notes with attachments
- Status change history
- Ticket linking

#### Dashboard & Analytics
- Real-time KPI widgets
- Ticket volume trends (30-day chart)
- SLA compliance tracking
- Department performance breakdown
- Agent productivity metrics
- Customer growth analytics
- Risk summary alerts

#### Reporting
- Ticket analytics (by status, priority, category, department)
- Customer analytics (by segment, risk, status)
- Agent performance reports (resolution rate, SLA compliance, satisfaction scores)
- Date range filtering
- CSV export ready

#### Real-time Notifications
- WebSocket-based push notifications
- SLA breach alerts
- Ticket assignment notifications
- Escalation notifications
- In-app notification center

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Using Docker (Recommended)

```bash
# Clone and setup
git clone <repo>
cd lisa-crm

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Start all services
docker compose up -d

# Wait for services to be ready (first run may take 2-3 minutes)
# The backend will auto-run migrations and seed data

# Access the application
open http://localhost:3000
```

### Manual Setup (Development)

```bash
# Start infrastructure
docker compose up postgres redis -d

# Backend setup
cd backend
cp .env.example .env        # Edit with your values
npm install
npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run start:dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

---

## Default Credentials

After seeding, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lisa-crm.com | Admin@123456 |
| Supervisor | supervisor@lisa-crm.com | Super@123456 |
| Agent | agent1@lisa-crm.com | Agent@123456 |
| Technical | agent2@lisa-crm.com | Agent@123456 |
| Claims | agent3@lisa-crm.com | Agent@123456 |
| Fraud | agent4@lisa-crm.com | Agent@123456 |

---

## API Documentation

Once the backend is running, Swagger documentation is available at:

```
http://localhost:3001/api/docs
```

### Key Endpoints

```
POST   /api/v1/auth/login              # Login
POST   /api/v1/auth/refresh            # Refresh token
POST   /api/v1/auth/logout             # Logout
GET    /api/v1/auth/profile            # Get current user

GET    /api/v1/customers               # List customers (paginated, filtered)
POST   /api/v1/customers               # Create customer
GET    /api/v1/customers/:id           # Get customer details
PUT    /api/v1/customers/:id           # Update customer
GET    /api/v1/customers/:id/timeline  # Get activity timeline
POST   /api/v1/customers/:id/notes     # Add note
POST   /api/v1/customers/:id/fraud-flag # Flag for fraud

GET    /api/v1/tickets                 # List tickets (paginated, filtered)
POST   /api/v1/tickets                 # Create ticket
GET    /api/v1/tickets/:id             # Get ticket details
PATCH  /api/v1/tickets/:id/status      # Update status
PATCH  /api/v1/tickets/:id/assign      # Assign ticket
POST   /api/v1/tickets/:id/notes       # Add note
POST   /api/v1/tickets/:id/escalate    # Escalate ticket

GET    /api/v1/dashboard/overview      # Dashboard data
GET    /api/v1/dashboard/realtime      # Real-time stats
GET    /api/v1/dashboard/risk-summary  # Risk summary

GET    /api/v1/reports/tickets         # Ticket analytics
GET    /api/v1/reports/agents          # Agent performance
GET    /api/v1/reports/customers       # Customer analytics

GET    /api/v1/notifications           # Get notifications
PATCH  /api/v1/notifications/:id/read  # Mark as read

GET    /api/v1/audit                   # Audit logs (Admin/Supervisor)
```

---

## Project Structure

```
lisa-crm/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication & JWT
│   │   │   ├── users/          # User management
│   │   │   ├── customers/      # Customer profiles
│   │   │   ├── tickets/        # Ticket system + SLA
│   │   │   ├── dashboard/      # Analytics
│   │   │   ├── reports/        # Reporting
│   │   │   ├── notifications/  # WebSocket notifications
│   │   │   └── audit/          # Audit logs
│   │   ├── common/
│   │   │   ├── decorators/     # Custom decorators
│   │   │   ├── filters/        # Exception filters
│   │   │   ├── guards/         # Auth & RBAC guards
│   │   │   └── interceptors/   # Transform & logging
│   │   ├── config/             # Redis configuration
│   │   ├── database/           # Prisma service
│   │   └── main.ts             # Application entry
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Seed data
│   └── Dockerfile
│
├── frontend/                   # Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/           # Login page
│   │   │   └── (dashboard)/    # Protected routes
│   │   │       ├── dashboard/  # Main dashboard
│   │   │       ├── customers/  # Customer management
│   │   │       ├── tickets/    # Ticket management
│   │   │       └── reports/    # Analytics
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, TopBar
│   │   │   └── dashboard/      # Dashboard widgets
│   │   ├── lib/                # API client, utilities
│   │   ├── store/              # Zustand auth store
│   │   └── types/              # TypeScript types
│   └── Dockerfile
│
└── docker/
    ├── docker-compose.yml      # Development
    ├── docker-compose.prod.yml # Production
    └── nginx/                  # Nginx config
```

---

## Database Schema

Core tables:
- `users` - System users with RBAC
- `customers` - Customer profiles with segmentation
- `customer_notes` - Customer notes (internal/external)
- `tickets` - Support tickets
- `ticket_notes` - Ticket comments and notes
- `ticket_status_history` - Status change audit trail
- `sla_policies` - SLA configuration per priority
- `sla_escalations` - Escalation records
- `interactions` - Call center interactions
- `fraud_flags` - Fraud investigation records
- `notifications` - In-app notifications
- `audit_logs` - Complete audit trail
- `auto_assignment_rules` - Auto-routing rules
- `system_settings` - Configuration

---

## Security Features

- **Passwords**: bcrypt with cost factor 12
- **JWT**: Short-lived access tokens (15min) + refresh tokens (7d)
- **Account Lockout**: After 5 failed attempts, 30-minute lockout
- **RBAC**: Role + department-based access control
- **Audit Logs**: All CREATE/UPDATE/DELETE/LOGIN actions logged with IP
- **Rate Limiting**: 100 requests/minute per IP
- **CORS**: Configurable allowed origins
- **Helmet**: Security headers
- **Input Validation**: class-validator on all inputs
- **GDPR**: Data retention configuration ready

---

## Performance

- **Redis Caching**: Dashboard data cached (1-minute TTL)
- **Database Indexes**: All foreign keys and frequently queried fields indexed
- **Pagination**: All list endpoints paginated (max 100 per page)
- **Background Jobs**: SLA breach detection runs every 5 minutes
- **Connection Pooling**: Prisma connection pooling
- **Compression**: gzip compression on API responses

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/lisa_crm
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Deployment

### Production Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT secrets (32+ chars, random)
- [ ] Configure SMTP for email notifications
- [ ] Set up SSL certificates
- [ ] Enable database backups
- [ ] Configure log aggregation
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure CDN for static assets
- [ ] Review CORS allowed origins
- [ ] Run `prisma migrate deploy` (not dev)

### Production Deployment

```bash
# Set production environment
cp .env.example .env
# Edit .env with production values

docker compose -f docker/docker-compose.prod.yml up -d
```

---

## License

MIT License - © 2024 LISA CRM
