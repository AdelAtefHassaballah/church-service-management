import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ServantAttendanceRecord, AttendanceStatus, UserProfile, ChurchService } from '../types';
import { servantAttendanceService } from '../services/servantAttendanceService';
import { userService } from '../services/userService';
import { serviceService } from '../services/serviceService';
import { DEFAULT_CHURCH_ID } from '../lib/uuid';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { 
  UserCheck, 
  Clock, 
  Calendar, 
  Save, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Layers,
  Sparkles,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ServantAttendancePage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();

  const services = serviceService.getAll();
  const allUsers = userService.getAll();

  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || 'srv-prep');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [servants, setServants] = useState<UserProfile[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; checkInTime?: string }>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedService = services.find(s => s.id === selectedServiceId);

  // Load servants assigned to selected service
  useEffect(() => {
    if (!selectedService) return;
    const assigned = allUsers.filter(u => 
      (u.role === 'servant' || u.role === 'leader') && 
      (selectedService.servant_ids?.includes(u.id) || u.service_ids?.includes(selectedService.id))
    );
    setServants(assigned);

    // Load existing attendance records for this date & service
    const existing = servantAttendanceService.getByDate(selectedDate, selectedServiceId);
    const map: Record<string, { status: AttendanceStatus; checkInTime?: string }> = {};

    assigned.forEach(s => {
      const match = existing.find(e => e.servant_id === s.id);
      if (match) {
        map[s.id] = { status: match.status, checkInTime: match.check_in_time };
      } else {
        map[s.id] = { status: 'present', checkInTime: '08:30 AM' };
      }
    });

    setAttendanceMap(map);
  }, [selectedServiceId, selectedDate]);

  const handleStatusChange = (servantId: string, status: AttendanceStatus) => {
    const current = attendanceMap[servantId];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAttendanceMap({
      ...attendanceMap,
      [servantId]: {
        status,
        checkInTime: status === 'present' ? (current?.checkInTime || nowTime) : undefined,
      },
    });
  };

  const handleSaveAttendance = async () => {
    const recordsToSave: Array<Omit<ServantAttendanceRecord, 'id' | 'created_at'>> = servants.map(s => {
      const item = attendanceMap[s.id] || { status: 'present' };
      return {
        church_id: DEFAULT_CHURCH_ID,
        service_id: selectedServiceId,
        servant_id: s.id,
        date: selectedDate,
        status: item.status,
        check_in_time: item.checkInTime,
        recorded_by: currentUser?.id,
        method: 'manual',
      };
    });

    await servantAttendanceService.saveBatch(recordsToSave);
    setSavedSuccess(true);
    confetti({ particleCount: 35, spread: 55 });
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const markAll = (status: AttendanceStatus) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated: Record<string, { status: AttendanceStatus; checkInTime?: string }> = {};
    servants.forEach(s => {
      updated[s.id] = {
        status,
        checkInTime: status === 'present' ? nowTime : undefined,
      };
    });
    setAttendanceMap(updated);
  };

  const presentCount = Object.values(attendanceMap).filter(v => v.status === 'present').length;
  const absentCount = Object.values(attendanceMap).filter(v => v.status === 'absent').length;
  const excusedCount = Object.values(attendanceMap).filter(v => v.status === 'excused').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {t('servantAttendance.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('servantAttendance.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="gold"
            size="md"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveAttendance}
          >
            {savedSuccess ? t('common.success') : t('attendance.saveAttendance')}
          </Button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('attendance.selectService')}
          </label>
          <select
            value={selectedServiceId}
            onChange={e => setSelectedServiceId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {language === 'ar' ? s.name_ar : s.name} ({s.day_of_week})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('attendance.selectDate')}
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* KPI Counters & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Present: {presentCount}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Absent: {absentCount}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-3.5 h-3.5" /> Excused: {excusedCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => markAll('present')}>
            {t('attendance.markAllPresent')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => markAll('absent')}>
            {t('attendance.markAllAbsent')}
          </Button>
        </div>
      </div>

      {/* Servants Attendance Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-start text-xs">
          <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3.5 text-start">{t('users.userCol')}</th>
              <th className="px-4 py-3.5 text-start">{t('servantAttendance.attendanceRate')}</th>
              <th className="px-4 py-3.5 text-start">{t('servantAttendance.checkInTime')}</th>
              <th className="px-4 py-3.5 text-end">Attendance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {servants.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No servants assigned to this service yet. Go to Church Services → Assignments.
                </td>
              </tr>
            ) : (
              servants.map(s => {
                const current = attendanceMap[s.id] || { status: 'present' };
                const rate = servantAttendanceService.getServantRate(s.id);

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Servant info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                          alt={s.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {language === 'ar' ? (s.name_ar || s.name) : s.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{s.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${rate.rate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{rate.rate}%</span>
                      </div>
                    </td>

                    {/* Check-in time input */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {current.status === 'present' ? (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
                          <Clock className="w-3.5 h-3.5 text-primary-500" />
                          <span>{current.checkInTime || '08:30 AM'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Status Toggle Buttons */}
                    <td className="px-4 py-3.5 text-end whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                          onClick={() => handleStatusChange(s.id, 'present')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            current.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                          }`}
                        >
                          {t('servantAttendance.markPresent')}
                        </button>
                        <button
                          onClick={() => handleStatusChange(s.id, 'absent')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            current.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                          }`}
                        >
                          {t('servantAttendance.markAbsent')}
                        </button>
                        <button
                          onClick={() => handleStatusChange(s.id, 'excused')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            current.status === 'excused'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                          }`}
                        >
                          {t('servantAttendance.markExcused')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
