import React, { useState } from 'react';
import { TaskPriority, TaskStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { storage } from '../../lib/storage';
import { serviceService } from '../../services/serviceService';
import { taskService } from '../../services/taskService';
import { CheckSquare, Save, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, language } = useLanguage();
  const services = serviceService.getAll();
  const profiles = storage.getProfiles().filter(p => p.status !== 'disabled');
  const members = storage.getMembers().filter(m => m.status === 'active');
  const groups = storage.getGroups();

  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [assignedTo, setAssignedTo] = useState(profiles[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('18:00');
  const [relatedMemberId, setRelatedMemberId] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAr = language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg(isAr ? 'برجاء إدخال عنوان المهمة.' : 'Please enter a task title.');
      return;
    }

    if (!assignedTo) {
      setErrorMsg(isAr ? 'برجاء اختيار الخادم أو الشخص المسند إليه المهمة.' : 'Please select an assigned servant or user.');
      return;
    }

    setIsSubmitting(true);
    try {
      await taskService.create({
        service_id: serviceId || undefined,
        group_id: groupId || undefined,
        title: title.trim(),
        title_ar: titleAr.trim() || title.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        assigned_to: assignedTo,
        priority,
        status,
        due_date: dueDate,
        due_time: dueTime || undefined,
        related_member_id: relatedMemberId || undefined,
      });

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      if (onSuccess) onSuccess();
      onClose();
      // Reset form
      setTitle('');
      setTitleAr('');
      setDescription('');
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err?.message || (isAr ? 'تعذر حفظ المهمة. برجاء المحاولة لاحقاً.' : 'Unable to create task. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <CheckSquare className="w-5 h-5" />
          <span>{t('tasks.createTask')}</span>
        </div>
      }
      subtitle={t('tasks.subtitle')}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Task Title EN */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('tasks.taskTitle')} (English) *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Pastoral home visit for Peter"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Task Title AR */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('tasks.taskTitle')} (العربية)
          </label>
          <input
            type="text"
            value={titleAr}
            onChange={e => setTitleAr(e.target.value)}
            placeholder="مثال: افتقاد منزلي للمخدوم بيتر"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Ministry / Service */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ministry / Service *
            </label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {isAr ? s.name_ar : s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned User */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('tasks.assignedTo')} *
            </label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <optgroup label="Servants & Leaders">
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {isAr ? (p.name_ar || p.name) : p.name} ({p.role})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('tasks.priority')}
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="low">{t('tasks.low')}</option>
              <option value="medium">{t('tasks.medium')}</option>
              <option value="high">{t('tasks.high')}</option>
              <option value="urgent">{t('tasks.urgent')}</option>
            </select>
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="pending">{t('tasks.pending')}</option>
              <option value="in_progress">{t('tasks.inProgress')}</option>
              <option value="completed">{t('tasks.completed')}</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('tasks.dueDate')} *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Due Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Due Time (Optional)
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Related Member */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('tasks.relatedMember')} (Optional)
            </label>
            <select
              value={relatedMemberId}
              onChange={e => setRelatedMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">None / General Pastoral Task</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {isAr ? m.arabic_name : m.full_name} ({m.phone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('tasks.description')}
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detailed pastoral instructions or background context..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Private Pastoral Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Confidential follow-up notes visible to leaders..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting} icon={<Save className="w-4 h-4" />}>
            {t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
