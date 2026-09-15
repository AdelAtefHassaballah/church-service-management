import { 
  UserProfile, 
  ChurchService,
  ServiceGroup, 
  Member, 
  AttendanceRecord, 
  ServantAttendanceRecord,
  WeeklyLesson, 
  Task, 
  CalendarEvent, 
  AppNotification, 
  AuditLog,
  QRCodeRecord,
  MemberServantAssignment
} from '../types';

export const INITIAL_SERVICES: ChurchService[] = [];
export const INITIAL_GROUPS: ServiceGroup[] = [];
export const INITIAL_PROFILES: UserProfile[] = [];
export const INITIAL_MEMBERS: Member[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_SERVANT_ATTENDANCE: ServantAttendanceRecord[] = [];
export const INITIAL_QR_RECORDS: QRCodeRecord[] = [];
export const INITIAL_ASSIGNMENTS: MemberServantAssignment[] = [];
export const INITIAL_LESSONS: WeeklyLesson[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_EVENTS: CalendarEvent[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
