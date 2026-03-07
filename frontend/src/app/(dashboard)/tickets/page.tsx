'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Filter, AlertTriangle, Clock,
  ChevronRight, RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import { Ticket, TicketStatus, TicketPriority, Department } from '@/types';
import { cn, getStatusColor, getPriorityColor, formatRelativeTime } from '@/lib/utils';

const STATUS_TABS: { key: TicketStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All Tickets' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'ESCALATED', label: 'Escalated' },
  { key: 'PENDING_CUSTOMER', label: 'Pending' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
];

export default function TicketsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', search, statusFilter, priorityFilter, departmentFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(departmentFilter && { department: departmentFilter }),
      });
      return api.get(`/tickets?${params}`) as Promise<any>;
    },
  });

  const tickets = data?.data as Ticket[] | undefined;
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage and track all support tickets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/tickets/new')}
            className="flex items-center gap-2 px-4 py-2 bg-lisa-500 hover:bg-lisa-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md transition-all',
              statusFilter === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-lisa-500"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-lisa-500"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-lisa-500"
        >
          <option value="">All Departments</option>
          <option value="TECHNICAL">Technical</option>
          <option value="CLAIMS">Claims</option>
          <option value="FRAUD">Fraud</option>
          <option value="BILLING">Billing</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      {/* Ticket count */}
      {meta && (
        <p className="text-sm text-gray-500">
          Showing {tickets?.length || 0} of {meta.total} tickets
        </p>
      )}

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-lisa-500 border-t-transparent rounded-full" />
            <p className="text-gray-400 text-sm mt-2">Loading tickets...</p>
          </div>
        ) : !tickets?.length ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No tickets found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono font-medium text-lisa-600 dark:text-lisa-400">
                            {ticket.ticketId}
                          </p>
                          {ticket.slaBreached && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" title="SLA Breached" />
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                          {ticket.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {ticket.customer && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {ticket.customer.firstName} {ticket.customer.lastName}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">{ticket.customer.customerId}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        getPriorityColor(ticket.priority),
                      )}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        getStatusColor(ticket.status),
                      )}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{ticket.department}</span>
                    </td>
                    <td className="px-4 py-3">
                      {ticket.assignee ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {ticket.assignee.firstName} {ticket.assignee.lastName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ticket.slaDeadline && (
                        <div className={cn(
                          'flex items-center gap-1 text-xs',
                          ticket.slaBreached ? 'text-red-600' : 'text-gray-500',
                        )}>
                          <Clock className="w-3 h-3" />
                          {ticket.slaBreached ? 'Breached' : formatRelativeTime(ticket.slaDeadline)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">{formatRelativeTime(ticket.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
