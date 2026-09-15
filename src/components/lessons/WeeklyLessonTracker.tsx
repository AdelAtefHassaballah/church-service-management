import React, { useState, useEffect } from 'react';
import { WeeklyLesson, LessonSubmissionStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { lessonService } from '../../services/lessonService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { WhatsAppModal } from '../common/WhatsAppModal';
import { 
  BookOpenCheck, 
  Clock, 
  Plus, 
  MessageSquare, 
  FileText, 
  Eye,
  Filter,
  Edit2,
  Calendar
} from 'lucide-react';

interface WeeklyLessonTrackerProps {
  onOpenSubmitModal: (lesson?: WeeklyLesson) => void;
  onViewLesson: (lesson: WeeklyLesson) => void;
}

export const WeeklyLessonTracker: React.FC<WeeklyLessonTrackerProps> = ({
  onOpenSubmitModal,
  onViewLesson,
}) => {
  const { t, language } = useLanguage();
  const { role, user } = useAuth();
  const isAr = language === 'ar';

  const services = storage.getServices();
  const groups = storage.getGroups();
  const servants = storage.getProfiles().filter(p => p.role === 'servant');

  const [lessons, setLessons] = useState<WeeklyLesson[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [selectedServantForWhatsApp, setSelectedServantForWhatsApp] = useState<any | null>(null);

  const loadLessons = async () => {
    const data = await lessonService.getAll();
    setLessons(data);
  };

  useEffect(() => {
    loadLessons();
  }, []);

  const filteredServants = servants.filter(s => {
    if (selectedServiceId !== 'all') {
      return s.service_ids?.includes(selectedServiceId);
    }
    return true;
  });

  const stats = lessonService.getStatsForWeek(selectedDate, selectedServiceId);

  const handleSendReminderToAllMissing = () => {
    const missingServants = filteredServants.filter(s => {
      const sub = lessons.find(l => l.servant_id === s.id && l.lesson_date === selectedDate);
      return !sub || sub.status === 'missing';
    });

    if (missingServants.length === 0) {
      alert(isAr ? 'جميع الخدام قاموا بتسليم تحضير الدروس!' : 'All servants have already submitted their lessons!');
      return;
    }

    setSelectedServantForWhatsApp(missingServants[0]);
  };

  const isServant = role === 'servant';
  const mySubmittedLesson = isServant ? lessons.find(l => l.servant_id === user?.id && l.lesson_date === selectedDate) : null;

  return (
    <div className="space-y-4">
      {/* Deadline Alert Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-900 to-indigo-900 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary-200 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">{t('lessons.deadlineBanner')}</h4>
            <p className="text-xs text-primary-200 mt-0.5">
              {isAr ? 'يتم احتساب أي تسليم بعد موعد الإغلاق كتسليم متأخر تلقائياً' : 'Submissions after deadline are automatically flagged as Late'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isServant ? (
            <Button
              variant="gold"
              size="sm"
              onClick={() => onOpenSubmitModal(mySubmittedLesson || undefined)}
              icon={mySubmittedLesson ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {mySubmittedLesson ? (isAr ? 'تعديل التحضير' : 'Edit My Lesson') : t('lessons.submitLesson')}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSendReminderToAllMissing}
              icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
            >
              {t('lessons.sendReminderToMissing')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-primary-500" />
            <span>{isAr ? 'تصفية حسب:' : 'Filter by:'}</span>
          </div>

          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            <option value="all">{isAr ? 'جميع الخدمات / القطاعات' : 'All Ministries / Services'}</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {isAr ? (s.name_ar || s.name) : s.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
            />
          </div>
        </div>

        <div className="text-slate-400 font-medium">
          {stats.totalActiveServants} {isAr ? 'خادم مسجل' : 'servants active'}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] text-slate-400 font-semibold">{t('lessons.submissionRate')}</p>
          <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">
            {stats.submissionRate}%
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{stats.submittedCount + stats.lateCount} / {stats.totalActiveServants} Servants</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] text-slate-400 font-semibold">{t('lessons.submitted')}</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.submittedCount}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">On Time</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] text-slate-400 font-semibold">{t('lessons.late')}</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {stats.lateCount}
          </p>
          <p className="text-[10px] text-amber-600 font-bold mt-0.5">After Deadline</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] text-slate-400 font-semibold">{t('lessons.missing')}</p>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {stats.missingCount}
          </p>
          <p className="text-[10px] text-rose-600 font-bold mt-0.5">Needs Reminder</p>
        </div>
      </div>

      {/* Servants Lesson Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-primary-600" />
            <span>{t('lessons.title')} ({selectedDate})</span>
          </h4>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredServants.map((servant) => {
            const lesson = lessons.find(
              l => l.servant_id === servant.id && l.lesson_date === selectedDate
            );
            const status: LessonSubmissionStatus = lesson ? lesson.status : 'missing';
            const group = groups.find(g => servant.group_ids?.includes(g.id));

            return (
              <div
                key={servant.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={servant.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                    alt={servant.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {isAr ? (servant.name_ar || servant.name) : servant.name}
                      </p>
                      {group && (
                        <Badge variant="primary" size="sm">
                          {isAr ? group.name_ar : group.name}
                        </Badge>
                      )}
                    </div>
                    {lesson ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        "{lesson.title}" • {lesson.attachments?.length || 0} attachments
                      </p>
                    ) : (
                      <p className="text-xs text-rose-500 font-medium mt-0.5">
                        {isAr ? 'لم يقم بتسليم التحضير بعد' : 'No lesson submitted yet'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <Badge
                    variant={status === 'submitted' ? 'success' : status === 'late' ? 'warning' : 'danger'}
                    size="md"
                    dot
                  >
                    {status === 'submitted'
                      ? t('lessons.submitted')
                      : status === 'late'
                      ? t('lessons.late')
                      : t('lessons.missing')}
                  </Badge>

                  {lesson ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewLesson(lesson)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        {t('common.view')}
                      </Button>
                      {(isServant && servant.id === user?.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenSubmitModal(lesson)}
                          icon={<Edit2 className="w-3.5 h-3.5 text-primary-600" />}
                        >
                          {isAr ? 'تعديل' : 'Edit'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedServantForWhatsApp(servant)}
                      icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                    >
                      {t('absentTracker.sendWhatsApp')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WhatsApp Modal for Lesson Deadline Notice */}
      {selectedServantForWhatsApp && (
        <WhatsAppModal
          isOpen={Boolean(selectedServantForWhatsApp)}
          onClose={() => setSelectedServantForWhatsApp(null)}
          recipientName={isAr ? (selectedServantForWhatsApp.name_ar || selectedServantForWhatsApp.name) : selectedServantForWhatsApp.name}
          recipientPhone={selectedServantForWhatsApp.whatsapp || selectedServantForWhatsApp.phone || ''}
          defaultTemplate="lesson_deadline"
          contextData={{
            deadline: isAr ? 'الخميس ٨:٠٠ مساءً' : 'Thursday 8:00 PM',
          }}
        />
      )}
    </div>
  );
};
