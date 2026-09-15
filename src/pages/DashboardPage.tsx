import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../lib/storage';
import { analyticsService } from '../services/analyticsService';
import { lessonService } from '../services/lessonService';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { 
  Users, 
  UserCheck, 
  HeartHandshake, 
  UserX, 
  BookOpenCheck, 
  CheckSquare, 
  CalendarDays, 
  QrCode, 
  Plus, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
  onOpenAddMember: () => void;
  onOpenSubmitLesson: () => void;
  onOpenCreateTask: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAddMember,
  onOpenSubmitLesson,
  onOpenCreateTask,
}) => {
  const { user, role } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);

  const members = storage.getMembers();
  const activeMembers = members.filter(m => m.status === 'active');
  const servants = storage.getProfiles().filter(p => p.role === 'servant');
  const tasks = storage.getTasks();
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const events = storage.getEvents();
  const auditLogs = storage.getAuditLogs().slice(0, 5);

  const groups = storage.getGroups();
  const attendanceRecords = storage.getAttendance();
  const lessonStats = lessonService.getStatsForWeek(new Date().toISOString().split('T')[0]);
  const attendanceTrend = analyticsService.getAttendanceTrend(trendDays);
  const taskStats = analyticsService.getTaskStats();
  const insights = analyticsService.getSmartInsights();

  // Dynamic attendance rate & subtitle
  let latestAttendanceRate = '0%';
  let attendanceSubtitle = t('common.noData');
  if (attendanceTrend.length > 0) {
    const latest = attendanceTrend[attendanceTrend.length - 1];
    latestAttendanceRate = `${latest.rate}%`;
    attendanceSubtitle = `${latest.present} ${t('attendance.present')} / ${latest.absent} ${t('attendance.absent')}`;
  }

  // Dynamic absent members count
  const absentMembersCount = members.filter(m => (m.consecutive_absences || 0) >= 2).length;

  const isAr = language === 'ar';
  const hasTaskData = taskStats.some(t => t.value > 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-primary-200 border border-white/10">
              {role.toUpperCase()} PORTAL
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {t('dashboard.welcome')}, {isAr ? (user?.name_ar || user?.name) : user?.name}!
          </h2>
          <p className="text-xs text-primary-100 max-w-xl">
            {t('app.tagline')}
          </p>
        </div>

        {/* Quick actions row */}
        <div className="flex flex-wrap items-center gap-2 relative z-10 w-full md:w-auto">
          {role === 'servant' ? (
            <>
              <Button
                variant="gold"
                size="sm"
                onClick={() => onNavigate('/qr-scanner')}
                icon={<QrCode className="w-4 h-4" />}
              >
                {t('dashboard.actionScanQR')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenSubmitLesson}
                icon={<BookOpenCheck className="w-4 h-4" />}
              >
                {t('dashboard.actionSubmitLesson')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="gold"
                size="sm"
                onClick={onOpenAddMember}
                icon={<Plus className="w-4 h-4" />}
              >
                {t('dashboard.actionAddMember')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('/attendance')}
                icon={<UserCheck className="w-4 h-4" />}
              >
                {t('dashboard.actionTakeAttendance')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenCreateTask}
                icon={<CheckSquare className="w-4 h-4" />}
              >
                {t('dashboard.actionCreateTask')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title={t('dashboard.totalMembers')}
          value={members.length}
          subtitle={`${activeMembers.length} Active`}
          icon={<Users className="w-6 h-6" />}
          color="primary"
          onClick={() => onNavigate('/members')}
        />

        <StatCard
          title={t('dashboard.attendanceRate')}
          value={latestAttendanceRate}
          subtitle={attendanceSubtitle}
          icon={<UserCheck className="w-6 h-6" />}
          color="emerald"
          onClick={() => onNavigate('/attendance')}
        />

        <StatCard
          title={t('dashboard.absentMembers')}
          value={absentMembersCount}
          subtitle={absentMembersCount > 0 ? "Needs Follow-up" : "All Accounted For"}
          icon={<UserX className="w-6 h-6" />}
          color="rose"
          onClick={() => onNavigate('/absent')}
        />

        <StatCard
          title={t('dashboard.lessonsSubmitted')}
          value={`${lessonStats.submittedCount + lessonStats.lateCount}/${lessonStats.totalActiveServants}`}
          subtitle={`${lessonStats.missingCount} Missing`}
          icon={<BookOpenCheck className="w-6 h-6" />}
          color="purple"
          onClick={() => onNavigate('/lessons')}
        />

        <StatCard
          title={t('dashboard.pendingTasks')}
          value={pendingTasks.length}
          subtitle={`${completedTasks.length} Completed`}
          icon={<CheckSquare className="w-6 h-6" />}
          color="amber"
          onClick={() => onNavigate('/tasks')}
        />

        <StatCard
          title={t('dashboard.totalServants')}
          value={servants.length}
          subtitle={`${groups.length} ${groups.length === 1 ? 'Group' : 'Groups'}`}
          icon={<HeartHandshake className="w-6 h-6" />}
          color="sky"
          onClick={() => onNavigate('/servants')}
        />
      </div>

      {/* Smart Service Insights Section */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('dashboard.insightsTitle')}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Live Diagnostic</span>
        </div>

        {insights.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No diagnostic alerts. All systems running normally.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins) => (
              <div
                key={ins.id}
                onClick={() => ins.action_link && onNavigate(ins.action_link)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex items-start justify-between gap-3 ${
                  ins.type === 'positive'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-100'
                    : ins.type === 'warning'
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-100'
                    : ins.type === 'critical'
                    ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-100'
                    : 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/40 text-sky-900 dark:text-sky-100'
                }`}
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-bold">
                    {isAr ? ins.title_ar : ins.title_en}
                  </h4>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    {isAr ? ins.description_ar : ins.description_en}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 mt-1 opacity-60" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                <span>{t('dashboard.attendanceTrend')}</span>
              </h3>
              <p className="text-xs text-slate-400">Past service attendance rate percentage</p>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setTrendDays(7)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  trendDays === 7 ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {t('dashboard.last7Days')}
              </button>
              <button
                onClick={() => setTrendDays(30)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  trendDays === 30 ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {t('dashboard.last30Days')}
              </button>
              <button
                onClick={() => setTrendDays(90)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  trendDays === 90 ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {t('dashboard.last3Months')}
              </button>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {attendanceTrend.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <UserCheck className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs font-medium text-slate-400">
                  No attendance records logged yet.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#026bc7"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#026bc7', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Task Breakdown Pie Chart */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>{t('dashboard.taskBreakdown')}</span>
            </h3>
            <p className="text-xs text-slate-400">Status across pastoral assignments</p>
          </div>

          <div className="h-44 w-full my-2 flex items-center justify-center">
            {!hasTaskData ? (
              <div className="text-center py-6 space-y-1">
                <CheckSquare className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400">No pastoral tasks created yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            {taskStats.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-400 truncate">{isAr ? item.name_ar : item.name}:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Service Activity stream */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {t('dashboard.recentActivity')}
        </h3>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No recent activity logs recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{log.details}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">by {log.user_name} • {log.action}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
