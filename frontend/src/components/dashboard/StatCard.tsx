import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow';
  description?: string;
  trend?: number | null;
  urgent?: boolean;
}

const colorMap = {
  blue: {
    icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-900',
  },
  green: {
    icon: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-900',
  },
  red: {
    icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-900',
  },
  orange: {
    icon: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-900',
  },
  purple: {
    icon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-900',
  },
  yellow: {
    icon: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-900',
  },
};

export function StatCard({ title, value, icon: Icon, color, description, trend, urgent }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl border p-5 transition-all hover:shadow-md',
        colors.border,
        urgent && 'ring-2 ring-red-400 ring-offset-1 animate-pulse-slow',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend !== null && trend !== undefined && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          {trend >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              trend >= 0 ? 'text-green-600' : 'text-red-600',
            )}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  );
}
