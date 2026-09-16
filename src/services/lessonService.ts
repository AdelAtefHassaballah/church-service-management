import { WeeklyLesson, LessonSubmissionStatus, LessonAttachment } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID, sanitizeUUID, DEFAULT_CHURCH_ID } from '../lib/uuid';

export interface LessonLeaderStats {
  totalActiveServants: number;
  submittedCount: number;
  lateCount: number;
  missingCount: number;
  submissionRate: number;
  onTimeRate: number;
  averageSubmissionTime: string;
}

export const lessonService = {
  getAll: async (): Promise<WeeklyLesson[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('weekly_lessons')
          .select('*')
          .order('lesson_date', { ascending: false });

        if (!error && data) {
          const mapped: WeeklyLesson[] = data.map((lsn: any) => ({
            id: lsn.id,
            church_id: sanitizeUUID(lsn.church_id) || DEFAULT_CHURCH_ID,
            service_id: sanitizeUUID(lsn.service_id) || undefined,
            group_id: lsn.group_id || undefined,
            servant_id: lsn.servant_id,
            title: lsn.title,
            lesson_date: lsn.lesson_date,
            deadline: lsn.deadline,
            submission_date: lsn.submission_date || undefined,
            description: lsn.description || undefined,
            bible_reference: lsn.bible_reference || undefined,
            status: lsn.status || 'missing',
            attachments: Array.isArray(lsn.attachments) ? lsn.attachments : [],
            leader_feedback: lsn.leader_feedback || undefined,
            created_at: lsn.created_at || new Date().toISOString(),
          }));

          mapped.forEach((lsn) => storage.saveLesson(lsn));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase lessons fetch error, using local storage:', err);
      }
    }
    return storage.getLessons();
  },

  getByServant: async (servantId: string): Promise<WeeklyLesson[]> => {
    const all = await lessonService.getAll();
    return all.filter(l => l.servant_id === servantId);
  },

  getByDate: async (lessonDate: string): Promise<WeeklyLesson[]> => {
    const all = await lessonService.getAll();
    return all.filter(l => l.lesson_date === lessonDate);
  },

  uploadFile: async (file: File): Promise<LessonAttachment> => {
    const id = generateUUID();

    // Convert file to Base64 data URL for persistent offline/local storage
    const base64Url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    let publicUrl = base64Url;

    if (isSupabaseConfigured() && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `lessons/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('lesson_files')
          .upload(filePath, file);

        if (!uploadError) {
          const { data } = supabase.storage.from('lesson_files').getPublicUrl(filePath);
          if (data?.publicUrl) {
            publicUrl = data.publicUrl;
          }
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, using persistent base64 data URL:', err);
      }
    }

    return {
      id,
      name: file.name,
      url: publicUrl,
      size: file.size,
      type: file.type || 'application/octet-stream',
    };
  },

  submitLesson: async (
    servantId: string,
    groupId: string,
    title: string,
    lessonDate: string,
    description?: string,
    bibleReference?: string,
    attachments: LessonAttachment[] = [],
    existingLessonId?: string,
    serviceId?: string
  ): Promise<WeeklyLesson> => {
    const activeUser = storage.getActiveUser();

    // Compute deadline for that lesson date (e.g. Thursday before service at 8:00 PM)
    const serviceDate = new Date(lessonDate);
    const deadlineDate = new Date(serviceDate);
    const dayOfWeek = serviceDate.getDay();
    const daysToSubtract = (dayOfWeek + 7 - 4) % 7 || 7;
    deadlineDate.setDate(serviceDate.getDate() - daysToSubtract);
    deadlineDate.setHours(20, 0, 0, 0);

    const now = new Date();
    const isLate = now > deadlineDate;
    const status: LessonSubmissionStatus = isLate ? 'late' : 'submitted';

    const lesson: WeeklyLesson = {
      id: existingLessonId && sanitizeUUID(existingLessonId) ? existingLessonId : generateUUID(),
      church_id: DEFAULT_CHURCH_ID,
      service_id: serviceId || undefined,
      group_id: groupId || undefined,
      servant_id: servantId,
      title: title.trim(),
      lesson_date: lessonDate,
      deadline: deadlineDate.toISOString(),
      submission_date: now.toISOString(),
      description: description?.trim() || undefined,
      bible_reference: bibleReference?.trim() || undefined,
      status,
      attachments,
      created_at: now.toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const sanitizedServant = sanitizeUUID(servantId);
      if (sanitizedServant) {
        try {
          const { data, error } = await supabase
            .from('weekly_lessons')
            .upsert({
              id: lesson.id,
              church_id: DEFAULT_CHURCH_ID,
              service_id: sanitizeUUID(lesson.service_id),
              group_id: lesson.group_id || null,
              servant_id: sanitizedServant,
              title: lesson.title,
              lesson_date: lesson.lesson_date,
              deadline: lesson.deadline,
              submission_date: lesson.submission_date,
              description: lesson.description || null,
              bible_reference: lesson.bible_reference || null,
              status: lesson.status,
              attachments: lesson.attachments || [],
              leader_feedback: lesson.leader_feedback || null,
              created_at: lesson.created_at,
            })
            .select()
            .single();

          if (!error && data) {
            const saved: WeeklyLesson = { ...lesson, id: data.id };
            storage.saveLesson(saved);
            storage.logAction(
              'LESSON_SUBMITTED',
              'weekly_lesson',
              `Servant ${activeUser?.name || 'Servant'} submitted lesson "${title}" (${status})`,
              data.id
            );
            return saved;
          }
        } catch (err) {
          console.warn('Supabase upsert lesson error, fallback local:', err);
        }
      }
    }

    storage.saveLesson(lesson);
    storage.logAction(
      'LESSON_SUBMITTED',
      'weekly_lesson',
      `Servant ${activeUser?.name || 'Servant'} submitted lesson "${title}" (${status})`,
      lesson.id
    );

    return lesson;
  },

  addFeedback: async (lessonId: string, feedback: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase && sanitizeUUID(lessonId)) {
      try {
        await supabase
          .from('weekly_lessons')
          .update({ leader_feedback: feedback })
          .eq('id', lessonId);
      } catch (err) {
        console.warn('Supabase feedback update error:', err);
      }
    }

    const lessons = storage.getLessons();
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      lesson.leader_feedback = feedback;
      storage.saveLesson(lesson);
      storage.logAction('LESSON_FEEDBACK_ADDED', 'weekly_lesson', `Leader added feedback for lesson: ${lesson.title}`, lessonId);
    }
  },

  getStatsForWeek: (targetDate: string, serviceId?: string): LessonLeaderStats => {
    let servants = storage.getProfiles().filter(p => p.role === 'servant' && p.status === 'active');
    if (serviceId && serviceId !== 'all') {
      servants = servants.filter(s => s.service_ids?.includes(serviceId));
    }

    const lessons = storage.getLessons().filter(l => l.lesson_date === targetDate);

    const submitted = lessons.filter(l => l.status === 'submitted');
    const late = lessons.filter(l => l.status === 'late');
    const totalSubmitted = submitted.length + late.length;
    const totalServants = servants.length || 1;
    const missingCount = Math.max(0, totalServants - totalSubmitted);

    const submissionRate = Math.round((totalSubmitted / totalServants) * 100);
    const onTimeRate = totalSubmitted > 0 ? Math.round((submitted.length / totalSubmitted) * 100) : 0;

    return {
      totalActiveServants: totalServants,
      submittedCount: submitted.length,
      lateCount: late.length,
      missingCount,
      submissionRate,
      onTimeRate,
      averageSubmissionTime: 'Thursday 6:15 PM',
    };
  }
};
