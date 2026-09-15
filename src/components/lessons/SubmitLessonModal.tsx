import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubmitLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialLesson?: WeeklyLesson | null;
}

export const SubmitLessonModal: React.FC<SubmitLessonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialLesson,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';

  const services = storage.getServices();
  const groups = storage.getGroups();

  const [title, setTitle] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceId, setServiceId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [bibleReference, setBibleReference] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialLesson) {
      setTitle(initialLesson.title);
      setLessonDate(initialLesson.lesson_date);
      setGroupId(initialLesson.group_id);
      setBibleReference(initialLesson.bible_reference || '');
      setDescription(initialLesson.description || '');
      setAttachments(initialLesson.attachments || []);
    } else {
      setTitle('');
      setLessonDate(new Date().toISOString().split('T')[0]);
      setServiceId(services[0]?.id || '');
      setGroupId(groups[0]?.id || '');
      setBibleReference('');
      setDescription('');
      setAttachments([]);
    }
    setFormError('');
  }, [initialLesson, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(isAr ? 'جاري معالجة ورفع الملفات...' : 'Processing and uploading files...');

    try {
      const uploadedList: LessonAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attachment = await lessonService.uploadFile(file);
        uploadedList.push(attachment);
      }
      setAttachments(prev => [...prev, ...uploadedList]);
      setUploadProgress('');
    } catch (err: any) {
      setFormError(err.message || (isAr ? 'فشل رفع بعض الملفات' : 'Failed to upload some files'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError(isAr ? 'يرجى إدخال عنوان الدرس' : 'Please enter lesson title');
      return;
    }
    if (!lessonDate) {
      setFormError(isAr ? 'يرجى تحديد تاريخ الدرس' : 'Please select lesson date');
      return;
    }

    try {
      await lessonService.submitLesson(
        user?.id || 'usr-servant-1',
        groupId || groups[0]?.id || 'group-1',
        title,
        lessonDate,
        description,
        bibleReference,
        attachments,
        initialLesson?.id
      );

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit lesson');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImageFile = (type: string, name: string) => {
    return type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(name);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <BookOpenCheck className="w-5 h-5" />
          <span>{initialLesson ? (isAr ? 'تعديل تحضير الدرس' : 'Edit Submitted Lesson') : t('lessons.submitLesson')}</span>
        </div>
      }
      subtitle={isAr ? 'تسليم تحضير درس الأسبوع والمرفقات' : 'Submit weekly lesson preparation, slides, and handouts'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

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
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Ministry / Service */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'الخدمة / القطاع' : 'Ministry / Service'}
            </label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {isAr ? (s.name_ar || s.name) : s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.group')}
            </label>
            <select
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
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
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
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
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* File Upload Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('lessons.attachments')} (PDF, DOCX, PPTX, Images)
          </label>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-primary-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
            {isUploading ? (
              <div className="py-2 flex flex-col items-center gap-1.5">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                <span className="text-xs text-primary-600 font-semibold">{uploadProgress}</span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {isAr ? 'انقر لاختيار ملفات التحضير أو الصور أو العرض التقديمي' : 'Click to select preparation files, slides, or images'}
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  className="mt-2 text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              </>
            )}
          </div>

          {/* Uploaded attachments list */}
          {attachments.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {attachments.map(att => (
                <div key={att.id} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    {isImageFile(att.type, att.name) ? (
                      <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{att.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({formatFileSize(att.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
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
            {initialLesson ? (isAr ? 'حفظ التعديلات' : 'Update Lesson') : t('lessons.submitLesson')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
