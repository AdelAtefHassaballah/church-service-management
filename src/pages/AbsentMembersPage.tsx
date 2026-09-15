import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../lib/storage';
import { attendanceService, AbsentMemberSummary } from '../services/attendanceService';
import { WhatsAppModal } from '../components/common/WhatsAppModal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { 
  UserX, 
  MessageSquare, 
  Phone, 
  Calendar, 
  AlertTriangle, 
  HeartHandshake, 
  CheckCircle,
  Plus
} from 'lucide-react';
import { Member } from '../types';

interface AbsentMembersPageProps {
  onOpenCreateTaskForMember?: (memberId: string) => void;
}

export const AbsentMembersPage: React.FC<AbsentMembersPageProps> = ({
  onOpenCreateTaskForMember,
}) => {
  const { t, language } = useLanguage();
  const groups = storage.getGroups();
  const servants = storage.getProfiles();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [whatsAppMember, setWhatsAppMember] = useState<Member | null>(null);

  const absentList = attendanceService.getAbsentMembersForDate(selectedDate, selectedGroup);
  const isAr = language === 'ar';

  return (
    <div className="space-y-4">
      {/* Header and Date Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <span>{t('absentTracker.title')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('absentTracker.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400 font-semibold">{t('attendance.selectDate')}:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none"
            />
          </div>

          {/* Group Filter */}
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none"
          >
            <option value="all">{t('members.allGroups')}</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {isAr ? g.name_ar : g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Absent Count Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-900 to-slate-900 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-rose-300 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">
              {absentList.length} {t('absentTracker.absentCountMessage')} ({selectedDate})
            </h3>
            <p className="text-xs text-rose-200 mt-0.5">
              {isAr ? 'افتقد أولادك واطمئن على أحوالهم لتشجيعهم على الانتظام' : 'Reach out to missing attendees to maintain pastoral care'}
            </p>
          </div>
        </div>
      </div>

      {/* Absent Members List */}
      {absentList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800">
          <EmptyState
            icon={<CheckCircle className="w-10 h-10 text-emerald-500" />}
            title={t('absentTracker.noAbsent')}
            description="All active members in this group attended the service."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {absentList.map((item) => {
            const member = item.member;
            const group = groups.find(g => g.id === member.group_id);
            const servant = servants.find(s => s.id === member.assigned_servant_id);
            const isHighRisk = item.consecutiveAbsences >= 2;

            return (
              <div
                key={member.id}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                  isHighRisk 
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10' 
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {member.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {isAr ? member.arabic_name : member.full_name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {isAr ? member.full_name : member.arabic_name}
                        </p>
                      </div>
                    </div>

                    <Badge variant={isHighRisk ? 'danger' : 'warning'} size="sm">
                      {item.consecutiveAbsences} {isAr ? 'غياب متتالي' : 'Consecutive'}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                    {group && (
                      <Badge variant="primary" size="sm">
                        {isAr ? group.name_ar : group.name}
                      </Badge>
                    )}
                    {servant && (
                      <Badge variant="neutral" size="sm">
                        {isAr ? (servant.name_ar || servant.name) : servant.name}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('absentTracker.lastAttended')}:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{item.lastAttendedDate || 'No record'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('absentTracker.attendanceRate')}:</span>
                      <span className="font-extrabold text-primary-600 dark:text-primary-400">{item.attendanceRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Follow-up Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setWhatsAppMember(member)}
                    icon={<MessageSquare className="w-3.5 h-3.5" />}
                    className="flex-1"
                  >
                    {t('absentTracker.sendWhatsApp')}
                  </Button>

                  <a
                    href={`tel:${member.phone}`}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                    title={t('absentTracker.callNow')}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Modal */}
      {whatsAppMember && (
        <WhatsAppModal
          isOpen={Boolean(whatsAppMember)}
          onClose={() => setWhatsAppMember(null)}
          recipientName={isAr ? whatsAppMember.arabic_name : whatsAppMember.full_name}
          recipientPhone={whatsAppMember.whatsapp || whatsAppMember.phone}
          defaultTemplate="absence"
        />
      )}
    </div>
  );
};
