import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { reportService } from '../services/reportService';
import { Button } from '../components/common/Button';
import { 
  FileSpreadsheet, 
  Users, 
  UserCheck, 
  BookOpenCheck, 
  CheckSquare, 
  Download,
  Printer
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span>{t('reports.title')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('reports.subtitle')}
          </p>
        </div>
      </div>

      {/* Reports Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Members Directory Report */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950 text-primary-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('reports.memberListReport')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export full contact list, emergency phone numbers, confession fathers, assigned servants, and groups.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => reportService.exportMembersCSV()}
            icon={<Download className="w-4 h-4" />}
            className="w-full"
          >
            {t('reports.exportCSV')}
          </Button>
        </div>

        {/* Attendance Log Report */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('reports.attendanceReport')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Comprehensive record of presents, absences, excuses, timestamps, and check-in methods (manual vs QR).
            </p>
          </div>

          <Button
            variant="success"
            size="sm"
            onClick={() => reportService.exportAttendanceCSV()}
            icon={<Download className="w-4 h-4" />}
            className="w-full"
          >
            {t('reports.exportCSV')}
          </Button>
        </div>

        {/* Weekly Lessons Report */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('reports.lessonReport')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Servant weekly lesson titles, submission deadlines, statuses (submitted, late, missing), and scripture verses.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => reportService.exportLessonsCSV()}
            icon={<Download className="w-4 h-4" />}
            className="w-full"
          >
            {t('reports.exportCSV')}
          </Button>
        </div>
      </div>
    </div>
  );
};
