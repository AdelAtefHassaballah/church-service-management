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
  Layers,
  Calendar,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const SESSIONS = [
  { id: 'Regular Meeting', name: 'Regular Sunday School / Meeting', name_ar: 'الاجتماع الأسبوعي / مدارس الأحد' },
  { id: 'Friday Youth Meeting', name: 'Friday Youth Meeting', name_ar: 'اجتماع الجمعة للشباب' },
  { id: 'Divine Liturgy', name: 'Divine Liturgy', name_ar: 'القداس الإلهي' },
  { id: 'Bible Study', name: 'Bible Study', name_ar: 'دراسة الكتاب المقدس' },
  { id: 'Special Activity', name: 'Special Activity / Trip', name_ar: 'نشاط خاص / رحلة' },
];

interface ManualAttendanceSheetProps {
  initialServiceId?: string;
  initialGroupId?: string;
  initialDate?: string;
}

export const ManualAttendanceSheet: React.FC<ManualAttendanceSheetProps> = ({
  initialServiceId,
  initialGroupId,
  initialDate,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';

  const services = storage.getServices();
  const groups = storage.getGroups();

  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || services[0]?.id || 'srv-prep');
  const [selectedSessionName, setSelectedSessionName] = useState(SESSIONS[0].id);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || 'all');
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMap, setStatusMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Filter members by selected service and group
  const members = storage.getMembers().filter(m => {
    if (m.status !== 'active') return false;
    if (selectedServiceId !== 'all') {
      const inService = m.service_ids?.includes(selectedServiceId);
      if (!inService) return false;
    }
    if (selectedGroupId !== 'all' && m.group_id !== selectedGroupId) {
      return false;
    }
    return true;
  });

  // Load existing records for service, session, group and date
  useEffect(() => {
    const existingRecords = attendanceService.getByServiceAndDate(selectedServiceId, selectedDate, selectedSessionName);
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
    setSaveMessage(null);
  }, [selectedServiceId, selectedSessionName, selectedGroupId, selectedDate]);

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    setStatusMap(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], status },
    }));
    setIsSaved(false);
    setSaveMessage(null);
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
    setSaveMessage(null);
  };

  const handleSave = async () => {
    const recordsToSave = members.map(m => {
      const item = statusMap[m.id] || { status: 'present', notes: '' };
      return {
        service_id: selectedServiceId,
        session_name: selectedSessionName,
        group_id: m.group_id || 'grp-1',
        member_id: m.id,
        date: selectedDate,
        status: item.status,
        notes: item.notes,
        recorded_by: user?.id,
        method: 'manual' as const,
      };
    });

    await attendanceService.saveBulk(recordsToSave);
    setIsSaved(true);
    setSaveMessage(isAr ? `تم حفظ حضور ${recordsToSave.length} مخدوم بنجاح!` : `Saved attendance for ${recordsToSave.length} members successfully!`);
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
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Ministry / Service selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary-500" />
              <span>{isAr ? 'الخدمة / القطاع *' : 'Ministry / Service *'}</span>
            </label>
            <select
              value={selectedServiceId}
              onChange={e => setSelectedServiceId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{isAr ? 'كافة الخدمات' : 'All Services'}</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {isAr ? (s.name_ar || s.name) : s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Session Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {isAr ? 'نوع الجلسة / اللقاء *' : 'Session / Meeting Type *'}
            </label>
            <select
              value={selectedSessionName}
              onChange={e => setSelectedSessionName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SESSIONS.map(s => (
                <option key={s.id} value={s.id}>
                  {isAr ? s.name_ar : s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Group selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {t('attendance.selectGroup')}
            </label>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary-500" />
              <span>{t('attendance.selectDate')}</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Bulk action buttons and Save */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
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
          </div>

          <div className="flex items-center gap-2">
            {saveMessage && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {saveMessage}
              </span>
            )}
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

        {filteredMembers.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-1">
            <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold">{isAr ? 'لا يوجد مخدومين في هذا القطاع / المجموعة' : 'No active members found in this service / group'}</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
