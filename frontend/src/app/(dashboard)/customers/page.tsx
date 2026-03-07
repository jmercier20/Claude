'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Users, ChevronRight, Shield, AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import { Customer, CustomerStatus, RiskLevel, CustomerSegment } from '@/types';
import { cn, getRiskColor, formatRelativeTime, getInitials } from '@/lib/utils';

const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  HVC: 'High Value',
  MVC: 'Medium Value',
  LVC: 'Low Value',
  NEW: 'New',
  AT_RISK: 'At Risk',
  CHURNED: 'Churned',
};

const SEGMENT_COLORS: Record<CustomerSegment, string> = {
  HVC: 'bg-purple-100 text-purple-700',
  MVC: 'bg-blue-100 text-blue-700',
  LVC: 'bg-gray-100 text-gray-700',
  NEW: 'bg-green-100 text-green-700',
  AT_RISK: 'bg-orange-100 text-orange-700',
  CHURNED: 'bg-red-100 text-red-700',
};

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, statusFilter, riskFilter, segmentFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(riskFilter && { riskLevel: riskFilter }),
        ...(segmentFilter && { segment: segmentFilter }),
      });
      return api.get(`/customers?${params}`) as Promise<any>;
    },
  });

  const customers = data?.data as Customer[] | undefined;
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {meta?.total ? `${meta.total.toLocaleString()} total customers` : 'Manage customer profiles'}
          </p>
        </div>
        <button
          onClick={() => router.push('/customers/new')}
          className="flex items-center gap-2 px-4 py-2 bg-lisa-500 hover:bg-lisa-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Customer
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone, or ID..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-lisa-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-lisa-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BLOCKED">Blocked</option>
          <option value="VIP">VIP</option>
        </select>

        <select
          value={riskFilter}
          onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-lisa-500"
        >
          <option value="">All Risk Levels</option>
          <option value="LOW">Low Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="HIGH">High Risk</option>
          <option value="CRITICAL">Critical Risk</option>
        </select>

        <select
          value={segmentFilter}
          onChange={(e) => { setSegmentFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-lisa-500"
        >
          <option value="">All Segments</option>
          <option value="HVC">High Value</option>
          <option value="MVC">Medium Value</option>
          <option value="LVC">Low Value</option>
          <option value="NEW">New</option>
          <option value="AT_RISK">At Risk</option>
          <option value="CHURNED">Churned</option>
        </select>
      </div>

      {/* Customer Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !customers?.length ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No customers found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => router.push(`/customers/${customer.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-lisa-100 dark:bg-lisa-900/30 rounded-full flex items-center justify-center text-sm font-bold text-lisa-600 flex-shrink-0">
                          {getInitials(customer.firstName, customer.lastName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.firstName} {customer.lastName}
                            </p>
                            {customer.kycVerified && (
                              <Shield className="w-3.5 h-3.5 text-green-500" title="KYC Verified" />
                            )}
                          </div>
                          <p className="text-xs font-mono text-gray-400">{customer.customerId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email || '-'}</p>
                      <p className="text-xs text-gray-400">{customer.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                        customer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        customer.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-700' :
                        customer.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                        customer.status === 'VIP' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700',
                      )}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {(customer.riskLevel === 'HIGH' || customer.riskLevel === 'CRITICAL') && (
                          <AlertTriangle className={cn('w-3.5 h-3.5', customer.riskLevel === 'CRITICAL' ? 'text-red-600' : 'text-orange-500')} />
                        )}
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded',
                          getRiskColor(customer.riskLevel),
                        )}>
                          {customer.riskLevel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex px-2 py-0.5 rounded text-xs font-medium',
                        SEGMENT_COLORS[customer.segment],
                      )}>
                        {SEGMENT_LABELS[customer.segment]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {customer._count?.tickets || 0} open
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">
                        {customer.lastActivityAt ? formatRelativeTime(customer.lastActivityAt) : 'Never'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {meta.totalPages} • {meta.total} customers
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
        </>
      )}
    </div>
  );
}
