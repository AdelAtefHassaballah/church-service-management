import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { analyticsService } from '../services/analyticsService';
import { 
  BarChart3, 
  TrendingUp, 
  BookOpenCheck, 
  CheckSquare, 
  Users, 
  Award,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(30);

  const attendanceTrend = analyticsService.getAttendanceTrend(trendDays);
  const servantRankings = analyticsService.getServantLessonRankings();
  const groupDistribution = analyticsService.getGroupDistribution();
  const insights = analyticsService.getSmartInsights();
  const isAr = language === 'ar';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span>{t('analytics.title')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('analytics.subtitle')}
          </p>
        </div>

        {/* Time filters */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setTrendDays(7)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              trendDays === 7 ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {t('dashboard.last7Days')}
          </button>
          <button
            onClick={() => setTrendDays(30)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              trendDays === 30 ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {t('dashboard.last30Days')}
          </button>
          <button
            onClick={() => setTrendDays(90)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              trendDays === 90 ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {t('dashboard.last3Months')}
          </button>
        </div>
      </div>

      {/* Row 1: Attendance Growth & Group Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Trend Line */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <span>{t('analytics.attendanceOverTime')}</span>
            </h3>
            <p className="text-xs text-slate-400">Recorded attendance rates across past services</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {attendanceTrend.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400">No attendance sessions recorded yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#026bc7"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#026bc7' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Group Distribution Bar Chart */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>{t('analytics.memberDemographics')}</span>
            </h3>
            <p className="text-xs text-slate-400">Active member counts per group</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {groupDistribution.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400">No groups configured yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey={isAr ? 'name_ar' : 'name'} stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="membersCount" fill="#026bc7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Servant Weekly Lesson Consistency Rankings */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{t('analytics.lessonConsistency')}</span>
            </h3>
            <p className="text-xs text-slate-400">Timely preparation rate and leadership commitment</p>
          </div>
        </div>

        {servantRankings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No servants registered to rank yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {servantRankings.map((servant, idx) => (
              <div key={servant.servantId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    #{idx + 1}
                  </span>

                  <img
                    src={servant.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                    alt={servant.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAr ? servant.name_ar : servant.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {servant.onTime} On Time • {servant.late} Late • {servant.missing} Missing
                    </p>
                  </div>
                </div>

                {/* Consistency Bar */}
                <div className="flex items-center gap-3 w-full sm:w-60">
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-600 to-emerald-500 rounded-full"
                      style={{ width: `${servant.consistency}%` }}
                    />
                  </div>
                  <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400 font-mono shrink-0">
                    {servant.consistency}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
