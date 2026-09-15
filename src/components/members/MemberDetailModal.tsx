import React, { useState } from 'react';
import { Member, ServiceGroup, UserProfile, AttendanceRecord } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useLanguage } from '../../context/LanguageContext';
import { attendanceService } from '../../services/attendanceService';
import { storage } from '../../lib/storage';
import { 
  User, 
  CalendarCheck, 
  FileText, 
  QrCode, 
  Phone, 
  MessageSquare, 
  Lock, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  group?: ServiceGroup;
  servant?: UserProfile;
  onSendWhatsApp: (member: Member) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  group,
  servant,
  onSendWhatsApp,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'notes' | 'qr'>('overview');
  const [newNote, setNewNote] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<any>('all_leaders_servants');
  const isAr = language === 'ar';

  if (!member) return null;

  const attendanceHistory = attendanceService.getMemberHistory(member.id);
  const presentCount = attendanceHistory.filter(a => a.status === 'present').length;
  const absentCount = attendanceHistory.filter(a => a.status === 'absent').length;
  const totalCount = attendanceHistory.length || 1;
  const attendanceRate = Math.round((presentCount / totalCount) * 100);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const activeUser = storage.getActiveUser();
    storage.logAction('MEMBER_NOTE_ADDED', 'member', `Note added for ${member.full_name}: "${newNote.slice(0, 30)}..."`, member.id);
    setNewNote('');
    alert(isAr ? 'تم حفظ ملاحظة الافتقاد بنجاح' : 'Care note saved successfully!');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-sky-400 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {member.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? member.arabic_name : member.full_name}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr ? member.full_name : member.arabic_name} • {member.id}
            </p>
          </div>
        </div>
      }
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t('members.tabs.overview')}</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{t('members.tabs.attendance')} ({attendanceRate}%)</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('members.tabs.notes')}</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{t('members.tabs.qr')}</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Quick stats ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">{t('members.status')}</p>
                <Badge variant={member.status === 'active' ? 'success' : 'neutral'} size="sm" className="mt-1">
                  {member.status.toUpperCase()}
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">{t('members.group')}</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
                  {group ? (isAr ? group.name_ar : group.name) : 'N/A'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">{t('members.assignedServant')}</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
                  {servant ? (isAr ? (servant.name_ar || servant.name) : servant.name) : 'Unassigned'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-400">{t('dashboard.attendanceRate')}</p>
                <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {attendanceRate}% ({presentCount}/{totalCount})
                </p>
              </div>
            </div>

            {/* Profile fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] text-slate-400">
                  {isAr ? 'بيانات الاتصال' : 'Contact Information'}
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">{t('members.phone')}</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200" dir="ltr">{member.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">{t('members.whatsapp')}</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200" dir="ltr">{member.whatsapp}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">{t('members.address')}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{member.address || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">{t('members.emergencyContact')}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{member.emergency_contact_name || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-2.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] text-slate-400">
                  {isAr ? 'البيانات الكنسية والشخصية' : 'Church & Spiritual Information'}
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">{t('members.confessionFather')}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{member.confession_father || 'Fr. Mina Gerges'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">{t('members.dob')}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{member.date_of_birth || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">{t('members.gender')}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">{member.gender}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">{t('members.joinDate')}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{member.join_date}</span>
                </div>
              </div>
            </div>

            {/* Pastoral remark */}
            {member.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs">
                <p className="font-bold text-amber-800 dark:text-amber-300">{t('members.notes')}:</p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">{member.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="success"
                size="sm"
                onClick={() => onSendWhatsApp(member)}
                icon={<MessageSquare className="w-4 h-4" />}
              >
                {t('absentTracker.sendWhatsApp')}
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Attendance History */}
        {activeTab === 'attendance' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('members.attendanceHistory')}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {presentCount} Present • {absentCount} Absent • {attendanceRate}% Overall Rate
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
              {attendanceHistory.map((rec) => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {rec.status === 'present' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : rec.status === 'absent' ? (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{rec.date}</p>
                      <p className="text-[10px] text-slate-400 capitalize">via {rec.method}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant={rec.status === 'present' ? 'success' : rec.status === 'absent' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {rec.status.toUpperCase()}
                    </Badge>
                    {rec.notes && <p className="text-[10px] text-slate-400 mt-0.5">{rec.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Pastoral Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4 animate-fadeIn">
            <form onSubmit={handleAddNote} className="space-y-2.5">
              <textarea
                rows={3}
                required
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder={t('members.notesSection.notePlaceholder')}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={noteVisibility}
                    onChange={e => setNoteVisibility(e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <option value="all_leaders_servants">{t('members.notesSection.allLeadersServants')}</option>
                    <option value="servant_only">{t('members.notesSection.servantOnly')}</option>
                    <option value="leader_only">{t('members.notesSection.leaderOnly')}</option>
                    <option value="admin_only">{t('members.notesSection.adminOnly')}</option>
                  </select>
                </div>

                <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
                  {t('members.notesSection.saveNote')}
                </Button>
              </div>
            </form>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <p className="font-bold text-slate-700 dark:text-slate-300">Previous Note (Sep 10, 2026):</p>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                "Spoke with parents regarding upcoming sports championship and exam preparation. Member is enthusiastic and requested prayers."
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Recorded by: Kirollos Emil (Servant)</p>
            </div>
          </div>
        )}

        {/* Tab 4: QR Card */}
        {activeTab === 'qr' && (
          <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col items-center text-center space-y-3">
            <h4 className="text-base font-bold">{isAr ? member.arabic_name : member.full_name}</h4>
            <div className="p-3 bg-white rounded-xl shadow-md">
              <QRCodeSVG value={member.qr_code} size={150} level="H" />
            </div>
            <p className="text-xs font-mono text-primary-300">{member.qr_code}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
