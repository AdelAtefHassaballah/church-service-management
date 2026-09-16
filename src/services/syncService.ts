import { isSupabaseConfigured } from '../lib/supabase';
import { churchService } from './churchService';
import { userService } from './userService';
import { memberService } from './memberService';
import { serviceService } from './serviceService';
import { taskService } from './taskService';
import { calendarService } from './calendarService';
import { lessonService } from './lessonService';
import { attendanceService } from './attendanceService';
import { servantAttendanceService } from './servantAttendanceService';
import { qrService } from './qrService';

export const syncService = {
  syncAll: async (): Promise<void> => {
    if (!isSupabaseConfigured()) return;

    try {
      await churchService.fetchAll();

      await Promise.allSettled([
        userService.fetchAll(),
        memberService.fetchAll(),
        serviceService.fetchAll(),
        taskService.getAll(),
        calendarService.getAll(),
        lessonService.getAll(),
        attendanceService.getAll(),
        servantAttendanceService.fetchAll(),
        qrService.fetchAll(),
      ]);
    } catch (err) {
      console.warn('Background database sync error:', err);
    }
  }
};
