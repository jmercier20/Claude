'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, Download, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const COLORS = ['#3d57ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

type ReportTab = 'tickets' | 'customers' | 'agents';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('tickets');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [department, setDepartment] = useState('');

  const { data: ticketReport, isLoading: ticketLoading } = useQuery({
    queryKey: ['reports', 'tickets', dateFrom, dateTo, department],
    queryFn: () => {
      const params = new URLSearchParams({
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(department && { department }),
      });
      return api.get(`/reports/tickets?${params}`) as Promise<any>;
    },
    enabled: activeTab === 'tickets',
  });

  const { data: agentReport, isLoading: agentLoading } = useQuery({
    queryKey: ['reports', 'agents', dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams({
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      return api.get(`/reports/agents?${params}`) as Promise<any>;
    },
    enabled: activeTab === 'agents',
  });

  const { data: customerReport } = useQuery({
    queryKey: ['reports', 'customers', dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams({
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      return api.get(`/reports/customers?${params}`) as Promise<any>;
    },
    enabled: activeTab === 'customers',
  });

  const tData = ticketReport?.data;
  const aData = agentReport?.data as any[] | undefined;
  const cData = customerReport?.data;

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'tickets', label: 'Ticket Analytics' },
    { key: 'customers', label: 'Customer Analytics' },
    { key: 'agents', label: 'Agent Performance' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Comprehensive insights and performance metrics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Date filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lisa-500"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lisa-500"
          />
        </div>

        {activeTab === 'tickets' && (
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lisa-500"
          >
            <option value="">All Departments</option>
            <option value="TECHNICAL">Technical</option>
            <option value="CLAIMS">Claims</option>
            <option value="FRAUD">Fraud</option>
            <option value="BILLING">Billing</option>
            <option value="GENERAL">General</option>
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-all',
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ticket Analytics */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* SLA Compliance KPIs */}
          {tData?.slaStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Tickets', value: tData.summary },
                { label: 'SLA Met', value: tData.slaStats.met, color: 'text-green-600' },
                { label: 'SLA Breached', value: tData.slaStats.breached, color: 'text-red-600' },
                { label: 'Compliance Rate', value: `${tData.slaStats.complianceRate}%`, color: tData.slaStats.complianceRate >= 90 ? 'text-green-600' : 'text-orange-600' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p className={cn('text-2xl font-bold mt-1 text-gray-900 dark:text-white', kpi.color)}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By Status */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tickets by Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tData?.byStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="_count" name="Tickets" fill="#3d57ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By Category */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tickets by Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={tData?.byCategory || []} dataKey="_count" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                    {(tData?.byCategory || []).map((_: any, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Customer Analytics */}
      {activeTab === 'customers' && cData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Customers by Segment</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cData.bySegment || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="segment" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="_count" name="Customers" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Customers by Risk Level</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={cData.byRisk || []} dataKey="_count" nameKey="riskLevel" cx="50%" cy="50%" outerRadius={80}>
                  {(cData.byRisk || []).map((_: any, idx: number) => (
                    <Cell key={idx} fill={['#10b981', '#f59e0b', '#f97316', '#ef4444'][idx] || '#999'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Agent Performance */}
      {activeTab === 'agents' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-100 dark:border-gray-800">
              <tr>
                {['Agent', 'Department', 'Total Tickets', 'Resolved', 'Resolution Rate', 'SLA Breaches', 'Interactions', 'Avg. Satisfaction'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {(aData || []).map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.role}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{agent.department || '-'}</td>
                  <td className="px-4 py-3 text-sm text-center">{agent.totalTickets}</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600">{agent.resolvedTickets}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={cn('h-1.5 rounded-full', agent.resolutionRate >= 80 ? 'bg-green-500' : agent.resolutionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
                          style={{ width: `${agent.resolutionRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-10">{agent.resolutionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-red-600">{agent.slaBreaches}</td>
                  <td className="px-4 py-3 text-sm text-center">{agent.totalInteractions}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {agent.avgSatisfaction ? `${agent.avgSatisfaction}/5` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {agentLoading && (
            <div className="p-8 text-center">
              <div className="animate-spin inline-block w-5 h-5 border-2 border-lisa-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
