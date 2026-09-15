import { storage } from '../lib/storage';
import { InsightStat } from '../types';

export const analyticsService = {
  getAttendanceTrend: (days: 7 | 30 | 90 = 30) => {
    const attendance = storage.getAttendance();
    const members = storage.getMembers().filter(m => m.status === 'active');
    const totalActive = members.length || 1;

    // Group attendance by date
    const dateMap: { [date: string]: { present: number; absent: number; excused: number; total: number } } = {};

    for (const rec of attendance) {
      if (!dateMap[rec.date]) {
        dateMap[rec.date] = { present: 0, absent: 0, excused: 0, total: 0 };
      }
      if (rec.status === 'present') dateMap[rec.date].present++;
      else if (rec.status === 'absent') dateMap[rec.date].absent++;
      else if (rec.status === 'excused') dateMap[rec.date].excused++;
      dateMap[rec.date].total++;
    }

    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const slicedDates = sortedDates.slice(-Math.min(sortedDates.length, days === 7 ? 4 : days === 30 ? 8 : 12));

    return slicedDates.map(date => {
      const data = dateMap[date];
      const rate = Math.round((data.present / Math.max(data.total, totalActive)) * 100);
      return {
        date,
        formattedDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: data.present,
        absent: data.absent,
        excused: data.excused,
        rate,
      };
    });
  },

  getServantLessonRankings: () => {
    const servants = storage.getProfiles().filter(p => p.role === 'servant');
    const lessons = storage.getLessons();

    return servants.map(servant => {
      const servantLessons = lessons.filter(l => l.servant_id === servant.id);
      const onTime = servantLessons.filter(l => l.status === 'submitted').length;
      const late = servantLessons.filter(l => l.status === 'late').length;
      const missing = servantLessons.filter(l => l.status === 'missing').length;
      const total = servantLessons.length || 1;
      const consistency = Math.round((onTime / total) * 100);

      return {
        servantId: servant.id,
        name: servant.name,
        name_ar: servant.name_ar || servant.name,
        avatar: servant.avatar_url,
        onTime,
        late,
        missing,
        total,
        consistency,
      };
    }).sort((a, b) => b.consistency - a.consistency);
  },

  getTaskStats: () => {
    const tasks = storage.getTasks();
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => t.status === 'overdue').length;

    return [
      { name: 'Completed', name_ar: 'مكتملة', value: completed, color: '#10B981' },
      { name: 'In Progress', name_ar: 'قيد التنفيذ', value: inProgress, color: '#3B82F6' },
      { name: 'Pending', name_ar: 'قيد الانتظار', value: pending, color: '#F59E0B' },
      { name: 'Overdue', name_ar: 'متأخرة', value: overdue, color: '#EF4444' },
    ];
  },

  getGroupDistribution: () => {
    const groups = storage.getGroups();
    const members = storage.getMembers();

    return groups.map(g => ({
      name: g.name.split('-')[1] || g.name,
      name_ar: g.name_ar,
      membersCount: members.filter(m => m.group_id === g.id).length,
    }));
  },

  getSmartInsights: (): InsightStat[] => {
    const members = storage.getMembers();
    const attendance = storage.getAttendance();
    const lessons = storage.getLessons();
    const tasks = storage.getTasks();

    const insights: InsightStat[] = [];

    // Check missing lessons
    const missingLessons = lessons.filter(l => l.status === 'missing');
    if (missingLessons.length > 0) {
      insights.push({
        id: 'ins-1',
        type: 'warning',
        title_en: `${missingLessons.length} Weekly Lessons Missing`,
        title_ar: `يوجد ${missingLessons.length} دروس أسبوعية لم يتم تسليمها بعد`,
        description_en: 'Deadline is Thursday 8:00 PM. Send a WhatsApp prompt to remind servants.',
        description_ar: 'الموعد النهائي هو الخميس الساعة ٨ مساءً. أرسل تذكيراً سريعاً للخدام عبر واتساب.',
        metric: `${missingLessons.length}`,
        action_link: '/lessons',
      });
    }

    // Check overdue tasks
    const overdueTasks = tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.due_date) < new Date()));
    if (overdueTasks.length > 0) {
      insights.push({
        id: 'ins-2',
        type: 'critical',
        title_en: `${overdueTasks.length} Pastoral Tasks Require Attention`,
        title_ar: `${overdueTasks.length} مهام رعوية متأخرة تحتاج للمتابعة`,
        description_en: 'Follow up with assigned servants to ensure member visitation care is maintained.',
        description_ar: 'تواصل مع الخدام المسندة إليهم المهام للتأكد من إتمام افتقاد المخدومين.',
        metric: `${overdueTasks.length}`,
        action_link: '/tasks',
      });
    }

    // Attendance consistency observation
    if (attendance.length > 0 && members.length > 0) {
      const recentTrend = analyticsService.getAttendanceTrend(7);
      const latestRate = recentTrend.length > 0 ? recentTrend[recentTrend.length - 1].rate : 0;
      insights.push({
        id: 'ins-3',
        type: latestRate >= 75 ? 'positive' : 'warning',
        title_en: `${latestRate}% Latest Service Attendance Rate`,
        title_ar: `${latestRate}% نسبة حضور آخر خدمة`,
        description_en: `Calculated from ${members.length} registered active members.`,
        description_ar: `محسوبة بناءً على ${members.length} مخدوماً مسجلاً ونشطاً.`,
        metric: `${latestRate}%`,
        action_link: '/attendance',
      });
    } else if (members.length === 0) {
      insights.push({
        id: 'ins-welcome',
        type: 'info',
        title_en: 'System Ready for Member Enrollment',
        title_ar: 'النظام جاهز لتسجيل المخدومين',
        description_en: 'Get started by adding church members or importing a member roster.',
        description_ar: 'ابدأ بإضافة مخدومين جدد أو استيراد كشف المخدومين.',
        metric: '0',
        action_link: '/members',
      });
    }

    if (tasks.length === 0 && members.length > 0) {
      insights.push({
        id: 'ins-tasks-empty',
        type: 'info',
        title_en: 'No Pending Pastoral Follow-ups',
        title_ar: 'لا توجد مهام افتقاد معلقة',
        description_en: 'All pastoral follow-ups and tasks are up to date.',
        description_ar: 'جميع مهام الافتقاد والرعاية مكتملة حتى الآن.',
        metric: '100%',
        action_link: '/tasks',
      });
    }

    return insights;
  }
};
