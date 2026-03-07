import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'MMM dd, yyyy') {
  return format(new Date(date), fmt);
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date) {
  const d = new Date(date);
  if (isToday(d)) return `Today at ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `Yesterday at ${format(d, 'HH:mm')}`;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'text-gray-500 bg-gray-100',
    MEDIUM: 'text-blue-600 bg-blue-50',
    HIGH: 'text-orange-600 bg-orange-50',
    URGENT: 'text-red-600 bg-red-50',
    CRITICAL: 'text-red-700 bg-red-100 font-bold',
  };
  return colors[priority] || colors.MEDIUM;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: 'text-blue-700 bg-blue-50 border-blue-200',
    IN_PROGRESS: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    PENDING_CUSTOMER: 'text-purple-700 bg-purple-50 border-purple-200',
    ESCALATED: 'text-orange-700 bg-orange-50 border-orange-200',
    RESOLVED: 'text-green-700 bg-green-50 border-green-200',
    CLOSED: 'text-gray-600 bg-gray-50 border-gray-200',
    REOPENED: 'text-red-700 bg-red-50 border-red-200',
  };
  return colors[status] || '';
}

export function getRiskColor(risk: string): string {
  const colors: Record<string, string> = {
    LOW: 'text-green-600 bg-green-50',
    MEDIUM: 'text-yellow-600 bg-yellow-50',
    HIGH: 'text-orange-600 bg-orange-50',
    CRITICAL: 'text-red-700 bg-red-50 font-semibold',
  };
  return colors[risk] || '';
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
