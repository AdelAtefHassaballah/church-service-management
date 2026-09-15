import React, { useState } from 'react';
import { WeeklyLesson } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { lessonService } from '../../services/lessonService';
import { 
  BookOpenCheck, 
  FileText, 
  Calendar, 
  Clock, 
  Download, 
  MessageSquare, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface LessonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: WeeklyLesson | null;
}

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  isOpen,
  onClose,
  lesson,
}) => {
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const servants = storage.getProfiles();
  const groups = storage.getGroups();

  const [feedback, setFeedback] = useState(lesson?.leader_feedback || '');
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const isAr = language === 'ar';

  if (!lesson) return null;

  const servant = servants.find(s => s.id === lesson.servant_id);
  const group = groups.find(g => g.id === lesson.group_id);

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    lessonService.addFeedback(lesson.id, feedback);
    setFeedbackSaved(true);
    setTimeout(() => setFeedbackSaved(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <BookOpenCheck className="w-5 h-5" />
          <span>{lesson.title}</span>
        </div>
      }
      subtitle={`${servant ? (isAr ? servant.name_ar : servant.name) : 'Servant'} • ${lesson.lesson_date}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Top Info Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Badge
              variant={lesson.status === 'submitted' ? 'success' : lesson.status === 'late' ? 'warning' : 'danger'}
              size="md"
              dot
            >
              {lesson.status.toUpperCase()}
            </Badge>
            {group && (
              <Badge variant="primary" size="md">
                {isAr ? group.name_ar : group.name}
              </Badge>
            )}
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Submitted: {lesson.submission_date ? new Date(lesson.submission_date).toLocaleString() : 'N/A'}
          </span>
        </div>

        {/* Bible Reference */}
        {lesson.bible_reference && (
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">
              {t('lessons.bibleReference')}:
            </p>
            <p className="text-xs text-amber-900 dark:text-amber-200 italic font-serif leading-relaxed">
              "{lesson.bible_reference}"
            </p>
          </div>
        )}

        {/* Description / Outline */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            {t('lessons.description')}
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            {lesson.description || 'No additional notes provided.'}
          </p>
        </div>

        {/* Attachments list */}
        {lesson.attachments && lesson.attachments.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
              {t('lessons.attachments')} ({lesson.attachments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lesson.attachments.map(att => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-500 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{att.name}</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-primary-600 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Leader Feedback Section */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
            {t('lessons.leaderFeedback')}
          </h4>

          {role === 'admin' || role === 'leader' ? (
            <form onSubmit={handleSaveFeedback} className="space-y-2">
              <textarea
                rows={2}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder={isAr ? 'اكتب ملاحظاتك وتوجيهاتك للخادم لتشجيعه وتطوير تقديم الدرس...' : 'Provide constructive feedback for the servant...'}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" type="submit">
                  {feedbackSaved ? t('common.success') : t('common.save')}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
              {lesson.leader_feedback || (isAr ? 'لم تتم كتابة ملاحظات حتى الآن.' : 'No feedback entered yet.')}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
