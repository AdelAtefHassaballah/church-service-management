import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useLanguage } from '../../context/LanguageContext';
import { whatsappService, WhatsAppTemplateType } from '../../services/whatsappService';
import { MessageSquare, Send, Copy, Check, ExternalLink } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientPhone: string;
  defaultTemplate?: WhatsAppTemplateType;
  contextData?: {
    taskTitle?: string;
    dueDate?: string;
    eventName?: string;
    eventDate?: string;
    eventTime?: string;
    deadline?: string;
  };
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  recipientPhone,
  defaultTemplate = 'absence',
  contextData = {},
}) => {
  const { t, language } = useLanguage();
  const [template, setTemplate] = useState<WhatsAppTemplateType>(defaultTemplate);
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate initial message
  const currentMessage = whatsappService.buildMessage({
    recipientName,
    recipientPhone,
    templateType: template,
    customText: customMessage,
    contextData,
    language,
  });

  const handleSend = () => {
    whatsappService.openChat(recipientPhone, currentMessage);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <MessageSquare className="w-5 h-5" />
          <span>{t('whatsapp.dialogTitle')}</span>
        </div>
      }
      subtitle={t('whatsapp.dialogSubtitle')}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Recipient info box */}
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{t('whatsapp.recipient')}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{recipientName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{t('whatsapp.phone')}</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono" dir="ltr">{recipientPhone}</p>
          </div>
        </div>

        {/* Template selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('whatsapp.template')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTemplate('absence')}
              className={`px-3 py-2 text-xs font-medium rounded-xl border text-start transition-all ${
                template === 'absence'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              {t('whatsapp.templateAbsence')}
            </button>
            <button
              type="button"
              onClick={() => setTemplate('task_reminder')}
              className={`px-3 py-2 text-xs font-medium rounded-xl border text-start transition-all ${
                template === 'task_reminder'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              {t('whatsapp.templateTaskReminder')}
            </button>
            <button
              type="button"
              onClick={() => setTemplate('event_reminder')}
              className={`px-3 py-2 text-xs font-medium rounded-xl border text-start transition-all ${
                template === 'event_reminder'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              {t('whatsapp.templateEventReminder')}
            </button>
            <button
              type="button"
              onClick={() => setTemplate('lesson_deadline')}
              className={`px-3 py-2 text-xs font-medium rounded-xl border text-start transition-all ${
                template === 'lesson_deadline'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
              }`}
            >
              {t('whatsapp.templateLessonDeadline')}
            </button>
          </div>
        </div>

        {/* Message preview / edit area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('whatsapp.messagePreview')}
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('common.success') : 'Copy'}</span>
            </button>
          </div>
          <textarea
            rows={4}
            value={currentMessage}
            onChange={e => {
              setTemplate('custom');
              setCustomMessage(e.target.value);
            }}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all leading-relaxed"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="success"
            onClick={handleSend}
            icon={<ExternalLink className="w-4 h-4" />}
          >
            {t('whatsapp.openWhatsApp')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
