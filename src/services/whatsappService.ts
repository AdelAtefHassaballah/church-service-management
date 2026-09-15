export type WhatsAppTemplateType = 'absence' | 'task_reminder' | 'event_reminder' | 'lesson_deadline' | 'custom';

export interface WhatsAppPayload {
  recipientName: string;
  recipientPhone: string;
  templateType: WhatsAppTemplateType;
  customText?: string;
  contextData?: {
    memberName?: string;
    servantName?: string;
    leaderName?: string;
    taskTitle?: string;
    dueDate?: string;
    eventName?: string;
    eventDate?: string;
    eventTime?: string;
    deadline?: string;
  };
  language?: 'en' | 'ar';
}

export const whatsappService = {
  formatPhoneNumber: (phone: string): string => {
    // Strip non-digits except leading +
    let cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    // If Egyptian local number starting with 01... convert to 201...
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      cleaned = '2' + cleaned;
    }
    return cleaned;
  },

  buildMessage: (payload: WhatsAppPayload): string => {
    const isAr = payload.language === 'ar';
    const ctx = payload.contextData || {};
    const name = payload.recipientName || 'عزيزي الخادم / المخدوم';

    switch (payload.templateType) {
      case 'absence':
        if (isAr) {
          return `سلام ونعمة يا ${name}، افتقدناك جداً النهاردة في الكنيسة ومدارس الأحد. نتمنى تكون بخير وكل أمورك تمام، ومشتاقين نشوفك معانا الخدمة الجاية بإذن ربنا. ربنا معاك ويباركك دائماً 🙏✨`;
        }
        return `Hello ${name}, we truly missed you today at church and Sunday School! We hope you are doing well and would love to see you next time. God bless you! 🙏✨`;

      case 'task_reminder':
        if (isAr) {
          return `سلام ومحبة يا خادم المسيح ${name}، تذكير بمهمة الخدمة المسندة إليك: "${ctx.taskTitle || 'مهمة الخدمة'}"، موعد الاستحقاق: ${ctx.dueDate || 'قريباً'}. ربنا يبارك خدمتك وتعب محبتك! ✝️`;
        }
        return `Hello ${name}, this is a reminder about your assigned service task: "${ctx.taskTitle || 'Task'}" due on ${ctx.dueDate || 'soon'}. God bless your service! ✝️`;

      case 'event_reminder':
        if (isAr) {
          return `سلام ونعمة يا ${name}، تذكير بموعد نشاطنا القادم: "${ctx.eventName || 'نشاط الخدمة'}" يوم ${ctx.eventDate || ''} الساعة ${ctx.eventTime || ''}. في انتظارك تفرح وتشارك معانا! 🎉`;
        }
        return `Hello ${name}, friendly reminder about our upcoming event: "${ctx.eventName || 'Church Activity'}" on ${ctx.eventDate || ''} at ${ctx.eventTime || ''}. Looking forward to seeing you! 🎉`;

      case 'lesson_deadline':
        if (isAr) {
          return `سلام ومحبة يا خادم المسيح ${name}، تذكير بموعد إغلاق تسليم تحضير الدرس الأسبوعي لمدارس الأحد (الموعد النهائي: ${ctx.deadline || 'الخميس ٨:٠٠ مساءً'}). برجاء رفع التحضير عبر المنظومة. ربنا يباركك! 📖`;
        }
        return `Hello ${name}, reminder for weekly Sunday School lesson prep submission (Deadline: ${ctx.deadline || 'Thursday 8:00 PM'}). Please submit your lesson notes on the portal. God bless! 📖`;

      case 'custom':
      default:
        return payload.customText || (isAr ? `سلام ونعمة يا ${name}` : `Hello ${name}`);
    }
  },

  getDirectWhatsAppUrl: (phone: string, message: string): string => {
    const formattedPhone = whatsappService.formatPhoneNumber(phone);
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encoded}`;
  },

  openChat: (phone: string, message: string): void => {
    const url = whatsappService.getDirectWhatsAppUrl(phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
