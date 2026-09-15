import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'primary' | 'emerald' | 'amber' | 'rose' | 'purple' | 'sky';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  onClick,
}) => {
  const colorMap = {
    primary: 'from-blue-500/10 to-primary-500/5 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-900/40',
    emerald: 'from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
    amber: 'from-amber-500/10 to-yellow-500/5 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
    rose: 'from-rose-500/10 to-red-500/5 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40',
    purple: 'from-purple-500/10 to-indigo-500/5 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/40',
    sky: 'from-sky-500/10 to-cyan-500/5 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/40',
  };

  const iconBgMap = {
    primary: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden group ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-40 pointer-events-none`} />

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </h3>
            {trend && (
              <span className={`text-xs font-bold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`w-12 h-12 rounded-2xl ${iconBgMap[color]} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
