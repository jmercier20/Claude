'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Ticket, BarChart3, Settings,
  ChevronLeft, ChevronRight, Shield, FileText, Bell,
  UserCog, AlertTriangle, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  roles?: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/customers',
    label: 'Customers',
    icon: Users,
  },
  {
    href: '/tickets',
    label: 'Tickets',
    icon: Ticket,
  },
  {
    href: '/interactions',
    label: 'Interactions',
    icon: Phone,
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: ['ADMIN', 'SUPERVISOR', 'EXECUTIVE'],
  },
  {
    href: '/fraud',
    label: 'Fraud & Risk',
    icon: AlertTriangle,
    roles: ['ADMIN', 'SUPERVISOR', 'FRAUD', 'EXECUTIVE'],
  },
  {
    href: '/users',
    label: 'Users',
    icon: UserCog,
    roles: ['ADMIN', 'SUPERVISOR'],
  },
  {
    href: '/audit',
    label: 'Audit Logs',
    icon: FileText,
    roles: ['ADMIN', 'SUPERVISOR', 'EXECUTIVE'],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: ['ADMIN'],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || ''),
  );

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-gray-900 dark:bg-gray-950 text-white transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-800">
        <div className="flex-shrink-0 w-8 h-8 bg-lisa-500 rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-white text-sm">LISA CRM</p>
            <p className="text-gray-500 text-xs">v1.0.0</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group',
                    isActive
                      ? 'bg-lisa-500/20 text-lisa-400 font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                    collapsed && 'justify-center',
                  )}
                >
                  <item.icon className={cn('flex-shrink-0 w-5 h-5', isActive && 'text-lisa-400')} />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      {!collapsed && user && (
        <div className="border-t border-gray-800 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-lisa-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-gray-900 border border-gray-700 rounded-full p-1 text-gray-400 hover:text-white transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
