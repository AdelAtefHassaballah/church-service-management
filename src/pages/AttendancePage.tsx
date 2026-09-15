import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ManualAttendanceSheet } from '../components/attendance/ManualAttendanceSheet';
import { QRScannerView } from '../components/attendance/QRScannerView';
import { storage } from '../lib/storage';
import { Badge } from '../components/common/Badge';
import { 
  UserCheck, 
  QrCode, 
  History, 
  Calendar, 
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { Button } from '../components/common/Button';

export const AttendancePage: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'manual' | 'qr' | 'history'>('manual');

  const attendanceRecords = storage.getAttendance();
  const members = storage.getMembers();
  const groups = storage.getGroups();
  const isAr = language === 'ar';

  return (
    <div className="space-y-4">
      {/* Top Header and Tab switcher */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span>{t('attendance.title')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('attendance.subtitle')}
          </p>
        </div>

        {/* Tab switch pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t('attendance.manualTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{t('attendance.qrTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t('attendance.historyTab')}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Manual Attendance Sheet */}
      {activeTab === 'manual' && <ManualAttendanceSheet />}

      {/* Tab 2: Live QR Scanner */}
      {activeTab === 'qr' && <QRScannerView />}

      {/* Tab 3: Historical Records Table */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-primary-600" />
              <span>{t('attendance.historyTab')} ({attendanceRecords.length} entries)</span>
            </h3>

            <Button
              variant="outline"
              size="sm"
              onClick={() => reportService.exportAttendanceCSV()}
              icon={<FileSpreadsheet className="w-4 h-4" />}
            >
              {t('reports.exportCSV')}
            </Button>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">{t('members.fullName')}</th>
                  <th className="p-3.5">{t('members.group')}</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendanceRecords.map((rec) => {
                  const member = members.find(m => m.id === rec.member_id);
                  const group = groups.find(g => g.id === rec.group_id);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300 font-mono">{rec.date}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {member ? (isAr ? member.arabic_name : member.full_name) : rec.member_id}
                      </td>
                      <td className="p-3.5">
                        {group ? (
                          <Badge variant="primary" size="sm">
                            {isAr ? group.name_ar : group.name}
                          </Badge>
                        ) : 'N/A'}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={rec.status === 'present' ? 'success' : rec.status === 'absent' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {rec.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-500 capitalize">{rec.method}</td>
                      <td className="p-3.5 text-slate-400">{rec.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
