'use client';

import { useQuery } from '@tanstack/react-query';
import { TicketIcon, Users, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/lib/api';
import { DashboardOverview } from '@/types';
import { formatNumber, formatDate } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuthStore } from '@/store/auth.store';

const COLORS = ['#3d57ff', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
  CRITICAL: '#dc2626',
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.get('/dashboard/overview') as Promise<any>,
    refetchInterval: 60 * 1000, // refresh every minute
  });

  const { data: riskData } = useQuery({
    queryKey: ['dashboard', 'risk'],
    queryFn: () => api.get('/dashboard/risk-summary') as Promise<any>,
  });

  const dashData = overview?.data as DashboardOverview | undefined;
  const risk = riskData?.data;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good {getGreeting()}, {user?.firstName}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's what's happening across your CRM today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Open Tickets"
          value={formatNumber(dashData?.tickets.open || 0)}
          icon={TicketIcon}
          color="blue"
          description={`${dashData?.tickets.total || 0} total tickets`}
          trend={null}
        />
        <StatCard
          title="Resolved Today"
          value={formatNumber(dashData?.tickets.resolvedToday || 0)}
          icon={CheckCircle}
          color="green"
          description="Tickets closed today"
          trend={null}
        />
        <StatCard
          title="SLA Breaches"
          value={formatNumber(dashData?.tickets.slaBreached || 0)}
          icon={AlertTriangle}
          color={dashData?.tickets.slaBreached ? 'red' : 'green'}
          description="Active SLA breaches"
          urgent={!!dashData?.tickets.slaBreached}
        />
        <StatCard
          title="Total Customers"
          value={formatNumber(dashData?.customers.total || 0)}
          icon={Users}
          color="purple"
          description={`+${dashData?.customers.newThisMonth || 0} this month`}
          trend={dashData?.customers.growth}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Avg. Resolution Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {dashData?.tickets.avgResolutionHours || 0}h
          </p>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">High Risk Customers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {risk?.highRiskCustomers || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">{risk?.fraudFlags || 0} active fraud flags</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Customer Growth</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(dashData?.customers.growth || 0) > 0 ? '+' : ''}{dashData?.customers.growth || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">vs. last month</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ticket Trend */}
        <div className="col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Ticket Volume (Last 30 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dashData?.ticketTrend || []}>
              <defs>
                <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3d57ff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3d57ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v, 'MMM d')}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) => [value, 'Tickets']}
                labelFormatter={(label) => formatDate(label, 'MMM d, yyyy')}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3d57ff"
                strokeWidth={2}
                fill="url(#ticketGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By Priority */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Open Tickets by Priority
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={dashData?.byPriority || []}
                dataKey="_count"
                nameKey="priority"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={40}
              >
                {(dashData?.byPriority || []).map((entry) => (
                  <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || '#999'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [v, name]} />
              <Legend
                formatter={(v) => v.toLowerCase()}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Department */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Open Tickets by Department
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashData?.byDepartment || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} tickLine={false} width={80} />
              <Tooltip />
              <Bar dataKey="_count" name="Tickets" fill="#3d57ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Agents */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Top Performing Agents (This Month)
          </h3>
          <div className="space-y-3">
            {(dashData?.topAgents || []).slice(0, 5).map((agent, idx) => (
              <div key={agent.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                <div className="w-8 h-8 bg-lisa-100 dark:bg-lisa-900/30 rounded-full flex items-center justify-center text-xs font-bold text-lisa-600">
                  {agent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.role}</p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {agent.resolvedThisMonth}
                  </span>
                </div>
              </div>
            ))}
            {!dashData?.topAgents?.length && (
              <p className="text-sm text-gray-400 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
