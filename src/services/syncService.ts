import { isSupabaseConfigured } from '../lib/supabase';
import { userService } from './userService';
import { memberService } from './memberService';
import { serviceService } from './serviceService';
import { taskService } from './taskService';
import { calendarService } from './calendarService';
import { lessonService } from './lessonService';
import { attendanceService } from './attendanceService';
import { servantAttendanceService } from './servantAttendanceService';

export const syncService = {
  syncAll: async (): Promise<void> => {
    if (!isSupabaseConfigured()) return;

    try {
      await Promise.allSettled([
        userService.fetchAll(),
        memberService.fetchAll(),
        serviceService.fetchAll(),
        taskService.getAll(),
        calendarService.getAll(),
        lessonService.getAll(),
        attendanceService.getAll(),
        servantAttendanceService.fetchAll(),
      ]);
    } catch (err) {
      console.warn('Background database sync error:', err);
    }
  }
};
