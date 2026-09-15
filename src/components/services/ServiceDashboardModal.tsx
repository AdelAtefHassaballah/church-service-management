import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChurchService, UserProfile } from '../../types';
import { serviceService } from '../../services/serviceService';
import { userService } from '../../services/userService';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  X, 
  Users, 
  BookOpen, 
  UserCheck, 
  UserX, 
  CheckSquare, 
  BookOpenCheck, 
  CalendarDays, 
  TrendingUp, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface ServiceDashboardModalProps {
  service: ChurchService | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceDashboardModal: React.FC<ServiceDashboardModalProps> = ({
  service,
  isOpen,
  onClose,
}) => {
  const { t, language } = useLanguage();

  if (!isOpen || !service) return null;

  const stats = serviceService.getDashboardStats(service.id);
  const allUsers = userService.getAll();
  const leaders = allUsers.filter(u => service.leader_ids?.includes(u.id));

  // Mock trend data for service
  const attendanceTrendData = [
    { week: 'W1', rate: 78, attendees: Math.round(stats.totalMembers * 0.78) },
    { week: 'W2', rate: 82, attendees: Math.round(stats.totalMembers * 0.82) },
    { week: 'W3', rate: 75, attendees: Math.round(stats.totalMembers * 0.75) },
    { week: 'W4', rate: stats.attendanceRate, attendees: stats.attendanceThisWeek },
  ];

  const lessonSubmissionData = [
    { name: 'Submitted', count: stats.lessonsSubmitted, fill: '#10b981' },
    { name: 'Missing', count: stats.missingLessons, fill: '#f43f5e' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: service.color || '#2563eb' }}
            >
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {language === 'ar' ? service.name_ar : service.name} {t('services.serviceDashboard')}
                </h3>
                <Badge variant={service.status === 'active' ? 'success' : 'neutral'} size="sm">
                  {service.status === 'active' ? t('services.active') : t('services.disabled')}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {service.location} • {service.day_of_week} ({service.start_time} - {service.end_time})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Leaders Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('services.leader')}:
            </span>
            <div className="flex items-center gap-2">
              {leaders.map(l => (
                <div key={l.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <img
                    src={l.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                    alt={l.name}
                    className="w-5 h-5 rounded-md object-cover"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {language === 'ar' ? (l.name_ar || l.name) : l.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-center">
            <p className="text-2xl font-extrabold text-sky-900 dark:text-sky-100">{stats.totalMembers}</p>
            <p className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">{t('dashboard.totalMembers')}</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
            <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">{stats.totalServants}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">{t('dashboard.totalServants')}</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center">
            <p className="text-2xl font-extrabold text-purple-900 dark:text-purple-100">{stats.attendanceRate}%</p>
            <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">{t('dashboard.attendanceRate')}</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
            <p className="text-2xl font-extrabold text-rose-900 dark:text-rose-100">{stats.absentMembers}</p>
            <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">{t('dashboard.absentMembers')}</p>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-3 gap-3.5">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{stats.pendingTasks}</p>
              <p className="text-[10px] text-slate-400 font-medium">{t('dashboard.pendingTasks')}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{stats.lessonsSubmitted}</p>
              <p className="text-[10px] text-slate-400 font-medium">{t('dashboard.lessonsSubmitted')}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">{stats.upcomingEvents}</p>
              <p className="text-[10px] text-slate-400 font-medium">{t('dashboard.upcomingEvents')}</p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          {/* Attendance Trend Chart */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
              {t('dashboard.attendanceTrend')} (%)
            </h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrendData}>
                  <defs>
                    <linearGradient id="srvAttendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={service.color || '#2563eb'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={service.color || '#2563eb'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke={service.color || '#2563eb'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#srvAttendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lesson Submissions Breakdown */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpenCheck className="w-3.5 h-3.5 text-emerald-500" />
              {t('dashboard.lessonSubmissions')}
            </h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lessonSubmissionData} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
