'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, UserCheck, UserX, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { User } from '@/types';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  SUPERVISOR: 'bg-purple-100 text-purple-700',
  AGENT: 'bg-blue-100 text-blue-700',
  TECHNICAL: 'bg-cyan-100 text-cyan-700',
  CLAIMS: 'bg-yellow-100 text-yellow-700',
  FRAUD: 'bg-orange-100 text-orange-700',
  EXECUTIVE: 'bg-gray-100 text-gray-700',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      });
      return api.get(`/users?${params}`) as Promise<any>;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed to update user status'),
  });

  const users = data?.data as User[] | undefined;
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage system users and access control</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-lisa-500 hover:bg-lisa-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lisa-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lisa-500"
        >
          <option value="">All Roles</option>
          {Object.keys(ROLE_COLORS).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-lisa-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 dark:border-gray-800">
              <tr>
                {['User', 'Role', 'Department', 'Status', 'Last Login', 'Open Tickets', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {(users || []).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-lisa-100 dark:bg-lisa-900/30 rounded-full flex items-center justify-center text-sm font-bold text-lisa-600">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', ROLE_COLORS[user.role])}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {user.department || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                    )}>
                      <div className={cn('w-1.5 h-1.5 rounded-full', user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500')} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">
                    {(user as any)._count?.assignedTickets || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateStatusMutation.mutate({
                          id: user.id,
                          status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                        })}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          user.status === 'ACTIVE'
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-green-500 hover:bg-green-50',
                        )}
                        title={user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      >
                        {user.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
