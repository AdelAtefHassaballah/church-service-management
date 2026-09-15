import React, { useState, useEffect } from 'react';
import { Member, ServiceGroup, AttendanceStatus, AttendanceRecord } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { attendanceService } from '../../services/attendanceService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { 
  Check, 
  X, 
  Clock, 
  Save, 
  Search, 
  Users, 
  CheckCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ManualAttendanceSheetProps {
  initialGroupId?: string;
  initialDate?: string;
}

export const ManualAttendanceSheet: React.FC<ManualAttendanceSheetProps> = ({
  initialGroupId,
  initialDate,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const groups = storage.getGroups();

  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || groups[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMap, setStatusMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [isSaved, setIsSaved] = useState(false);

  const members = storage.getMembers().filter(
    m => m.status === 'active' && (selectedGroupId === 'all' || m.group_id === selectedGroupId)
  );

  // Load existing records for group and date
  useEffect(() => {
    const existingRecords = attendanceService.getByGroupAndDate(selectedGroupId, selectedDate);
    const newMap: Record<string, { status: AttendanceStatus; notes: string }> = {};

    for (const member of members) {
      const match = existingRecords.find(r => r.member_id === member.id);
      if (match) {
        newMap[member.id] = { status: match.status, notes: match.notes || '' };
      } else {
        newMap[member.id] = { status: 'present', notes: '' };
      }
    }
    setStatusMap(newMap);
    setIsSaved(false);
  }, [selectedGroupId, selectedDate]);

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    setStatusMap(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], status },
    }));
    setIsSaved(false);
  };

  const handleNotesChange = (memberId: string, notes: string) => {
    setStatusMap(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], notes },
    }));
    setIsSaved(false);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setStatusMap(prev => {
      const updated = { ...prev };
      for (const m of members) {
        updated[m.id] = { status, notes: prev[m.id]?.notes || '' };
      }
      return updated;
    });
    setIsSaved(false);
  };

  const handleSave = () => {
    const recordsToSave = members.map(m => {
      const item = statusMap[m.id] || { status: 'present', notes: '' };
      return {
        group_id: m.group_id || 'grp-1',
        member_id: m.id,
        date: selectedDate,
        status: item.status,
        notes: item.notes,
        recorded_by: user?.id || 'usr-servant-1',
        method: 'manual' as const,
      };
    });

    attendanceService.saveBulk(recordsToSave);
    setIsSaved(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  const filteredMembers = members.filter(
    m =>
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.arabic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  const presentCount = Object.values(statusMap).filter(v => v.status === 'present').length;
  const absentCount = Object.values(statusMap).filter(v => v.status === 'absent').length;
  const excusedCount = Object.values(statusMap).filter(v => v.status === 'excused').length;

  return (
    <div className="space-y-4">
      {/* Filter and selector toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Group selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {t('attendance.selectGroup')}
            </label>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="all">{t('members.allGroups')}</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {language === 'ar' ? g.name_ar : g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {t('attendance.selectDate')}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bulk action buttons and Save */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll('present')}
            icon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
          >
            {t('attendance.markAllPresent')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll('absent')}
            icon={<X className="w-4 h-4 text-rose-600" />}
          >
            {t('attendance.markAllAbsent')}
          </Button>
          <Button
            variant={isSaved ? 'success' : 'primary'}
            size="sm"
            onClick={handleSave}
            icon={<Save className="w-4 h-4" />}
          >
            {isSaved ? t('attendance.successSaved') : t('attendance.saveAttendance')}
          </Button>
        </div>
      </div>

      {/* Summary counters bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-center">
          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">{t('attendance.present')}</p>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{presentCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-center">
          <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300">{t('attendance.absent')}</p>
          <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{absentCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-center">
          <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">{t('attendance.excused')}</p>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{excusedCount}</p>
        </div>
      </div>

      {/* Member Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 left-3 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            {filteredMembers.length} {t('members.title')}
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
          {filteredMembers.map((member) => {
            const currentItem = statusMap[member.id] || { status: 'present', notes: '' };
            const isPresent = currentItem.status === 'present';
            const isAbsent = currentItem.status === 'absent';
            const isExcused = currentItem.status === 'excused';

            return (
              <div
                key={member.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    {member.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'ar' ? member.arabic_name : member.full_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {language === 'ar' ? member.full_name : member.arabic_name} • {member.phone}
                    </p>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(member.id, 'present')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isPresent
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 ring-2 ring-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('attendance.present')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(member.id, 'absent')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isAbsent
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/30 ring-2 ring-rose-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t('attendance.absent')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(member.id, 'excused')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isExcused
                        ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30 ring-2 ring-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('attendance.excused')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
