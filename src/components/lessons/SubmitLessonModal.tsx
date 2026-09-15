import React, { useState } from 'react';
import { WeeklyLesson, LessonAttachment } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { lessonService } from '../../services/lessonService';
import { 
  BookOpenCheck, 
  UploadCloud, 
  File, 
  Trash2, 
  Save, 
  FileText,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubmitLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubmitLessonModal: React.FC<SubmitLessonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const groups = storage.getGroups();

  const [title, setTitle] = useState('');
  const [lessonDate, setLessonDate] = useState('2026-09-18');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [bibleReference, setBibleReference] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isAr = language === 'ar';

  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setTimeout(() => {
      const newItems: LessonAttachment[] = Array.from(files).map((f, idx) => ({
        id: 'att-' + Date.now() + '-' + idx,
        name: f.name,
        url: URL.createObjectURL(f),
        size: f.size,
        type: f.type || 'application/octet-stream',
      }));

      setAttachments(prev => [...prev, ...newItems]);
      setIsUploading(false);
    }, 600);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lessonDate) return;

    lessonService.submitLesson(
      user?.id || 'usr-servant-1',
      groupId,
      title,
      lessonDate,
      description,
      bibleReference,
      attachments
    );

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <BookOpenCheck className="w-5 h-5" />
          <span>{t('lessons.submitLesson')}</span>
        </div>
      }
      subtitle={t('lessons.subtitle')}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lesson Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('lessons.lessonTitle')} *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isAr ? 'مثال: داود وجليات - الانتصار بالإيمان' : 'e.g. David & Goliath: Living by Faith'}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lesson Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('lessons.lessonDate')} *
            </label>
            <input
              type="date"
              required
              value={lessonDate}
              onChange={e => setLessonDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.group')} *
            </label>
            <select
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {isAr ? g.name_ar : g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bible Reference */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('lessons.bibleReference')}
          </label>
          <input
            type="text"
            value={bibleReference}
            onChange={e => setBibleReference(e.target.value)}
            placeholder={isAr ? 'مثال: ١ صموئيل ١٧: ٤٥ - "أَنْتَ تَأْتِي إِلَيَّ بِسَيْفٍ وَبِرُمْحٍ..."' : 'e.g. 1 Samuel 17:45'}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Lesson Description & Objectives */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('lessons.description')}
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={isAr ? 'اكتب الأهداف التربوية، عناصر الدرس، الوسائل الإيضاحية، ونشاط التطبيق العملي...' : 'Write lesson objectives, key outline, questions, and activity ideas...'}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* File Upload Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('lessons.attachments')} (PDF, PPT, DOC, Images)
          </label>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-primary-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {isAr ? 'انقر لاختيار ملفات التحضير أو العرض التقديمي' : 'Click to upload lesson slides or handouts'}
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={handleSimulatedFileUpload}
              className="mt-2 text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
            />
          </div>

          {/* Uploaded attachments list */}
          {attachments.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {attachments.map(att => (
                <div key={att.id} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{att.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({Math.round(att.size / 1024)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" isLoading={isUploading} icon={<Save className="w-4 h-4" />}>
            {t('lessons.submitLesson')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
