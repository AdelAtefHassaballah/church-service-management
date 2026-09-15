import { WeeklyLesson, LessonSubmissionStatus, LessonAttachment } from '../types';
import { storage } from '../lib/storage';

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
  getAll: (): WeeklyLesson[] => {
    return storage.getLessons();
  },

  getByServant: (servantId: string): WeeklyLesson[] => {
    return storage.getLessons().filter(l => l.servant_id === servantId);
  },

  getByDate: (lessonDate: string): WeeklyLesson[] => {
    return storage.getLessons().filter(l => l.lesson_date === lessonDate);
  },

  submitLesson: (
    servantId: string,
    groupId: string,
    title: string,
    lessonDate: string,
    description?: string,
    bibleReference?: string,
    attachments: LessonAttachment[] = []
  ): WeeklyLesson => {
    const activeUser = storage.getActiveUser();
    const settings = storage.getSettings();

    // Compute deadline for that lesson date (e.g. Thursday before service at 8:00 PM)
    const serviceDate = new Date(lessonDate);
    const deadlineDate = new Date(serviceDate);
    // Find preceding Thursday
    const dayOfWeek = serviceDate.getDay(); // 0: Sun, 5: Fri
    const daysToSubtract = (dayOfWeek + 7 - 4) % 7 || 7; // Thursday is day 4
    deadlineDate.setDate(serviceDate.getDate() - daysToSubtract);
    deadlineDate.setHours(20, 0, 0, 0);

    const now = new Date();
    const isLate = now > deadlineDate;
    const status: LessonSubmissionStatus = isLate ? 'late' : 'submitted';

    const existing = storage.getLessons().find(
      l => l.servant_id === servantId && l.lesson_date === lessonDate
    );

    const lesson: WeeklyLesson = {
      id: existing ? existing.id : 'lsn-' + Date.now(),
      church_id: 'church-1',
      group_id: groupId,
      servant_id: servantId,
      title,
      lesson_date: lessonDate,
      deadline: deadlineDate.toISOString(),
      submission_date: now.toISOString(),
      description,
      bible_reference: bibleReference,
      status,
      attachments: attachments.length > 0 ? attachments : (existing?.attachments || []),
      created_at: existing ? existing.created_at : now.toISOString(),
    };

    storage.saveLesson(lesson);
    storage.logAction(
      'LESSON_SUBMITTED',
      'weekly_lesson',
      `Servant ${activeUser?.name || 'Servant'} submitted lesson "${title}" (${status})`,
      lesson.id
    );

    return lesson;
  },

  addFeedback: (lessonId: string, feedback: string) => {
    const lessons = storage.getLessons();
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      lesson.leader_feedback = feedback;
      storage.saveLesson(lesson);
      storage.logAction('LESSON_FEEDBACK_ADDED', 'weekly_lesson', `Leader added feedback for lesson: ${lesson.title}`, lessonId);
    }
  },

  getStatsForWeek: (targetDate: string): LessonLeaderStats => {
    const servants = storage.getProfiles().filter(p => p.role === 'servant' && p.status === 'active');
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
