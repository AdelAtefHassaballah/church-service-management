export type Role = 'super_admin' | 'admin' | 'leader' | 'servant' | 'member';

export type UserStatus = 'active' | 'disabled' | 'pending';

export type Permission =
  | 'members.view'
  | 'members.create'
  | 'members.edit'
  | 'members.delete'
  | 'attendance.view'
  | 'attendance.create'
  | 'attendance.edit'
  | 'attendance.delete'
  | 'tasks.view'
  | 'tasks.create'
  | 'tasks.edit'
  | 'tasks.delete'
  | 'events.view'
  | 'events.create'
  | 'events.edit'
  | 'events.delete'
  | 'lessons.view'
  | 'lessons.create'
  | 'lessons.edit'
  | 'lessons.delete'
  | 'services.view'
  | 'services.create'
  | 'services.edit'
  | 'services.delete'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.disable'
  | 'analytics.view'
  | 'reports.view'
  | 'settings.manage'
  | 'qr.manage';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  name_ar?: string;
  role: Role;
  avatar_url?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female';
  church_id?: string;
  service_ids: string[]; // Services the user serves in / belongs to
  group_ids?: string[];
  permissions: Permission[];
  status: UserStatus;
  qr_code: string; // Every servant and user has a unique QR
  created_at: string;
  updated_at?: string;
}

export interface Church {
  id: string;
  name: string;
  name_ar: string;
  location?: string;
  created_at: string;
}

export type ServiceType = 
  | 'sunday_school'
  | 'youth'
  | 'children'
  | 'preparatory'
  | 'secondary'
  | 'university'
  | 'adults'
  | 'bible_study'
  | 'choir'
  | 'general';

export interface ChurchService {
  id: string;
  church_id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  service_type: ServiceType;
  location?: string;
  day_of_week?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  start_time?: string;
  end_time?: string;
  leader_ids: string[];
  servant_ids: string[];
  member_ids: string[];
  status: 'active' | 'disabled';
  color?: string;
  notes?: string;
  created_at: string;
}

export interface ServiceGroup {
  id: string;
  service_id?: string;
  church_id: string;
  name: string;
  name_ar: string;
  description?: string;
  leader_ids: string[];
  servant_ids: string[];
  created_at: string;
}

export interface MemberServantAssignment {
  id: string;
  service_id: string;
  servant_id: string;
  member_id: string;
  created_at: string;
}

export type MemberGender = 'male' | 'female';
export type MemberStatus = 'active' | 'inactive' | 'archived';

export interface Member {
  id: string;
  church_id: string;
  service_ids: string[]; // Member can belong to multiple services
  group_id?: string;
  full_name: string;
  arabic_name: string;
  photo_url?: string;
  date_of_birth?: string;
  gender: MemberGender;
  phone: string;
  whatsapp: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  join_date: string;
  baptism_date?: string;
  confession_father?: string;
  assigned_servant_id?: string;
  status: MemberStatus;
  notes?: string;
  consecutive_absences?: number;
  qr_code: string;
  created_at: string;
  updated_at?: string;
}

export type QRCodeEntityType = 'member' | 'servant' | 'user';

export interface QRCodeRecord {
  id: string;
  entity_type: QRCodeEntityType;
  entity_id: string;
  token: string;
  status: 'active' | 'disabled';
  service_ids: string[];
  created_at: string;
  last_scanned_at?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface AttendanceRecord {
  id: string;
  church_id: string;
  service_id: string; // Mandatory service/ministry
  group_id?: string;
  session_name?: string; // e.g. "Regular Sunday School", "Friday Youth Meeting"
  member_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  recorded_by: string; // User ID
  notes?: string;
  method: 'manual' | 'qr_scan';
  created_at: string;
}

export interface ServantAttendanceRecord {
  id: string;
  church_id: string;
  service_id: string;
  servant_id: string;
  date: string;
  status: AttendanceStatus;
  recorded_by: string;
  check_in_time?: string;
  method: 'manual' | 'qr_scan';
  notes?: string;
  created_at: string;
}

export type NoteVisibility = 'servant_only' | 'leader_only' | 'admin_only' | 'all_leaders_servants';

export interface MemberNote {
  id: string;
  member_id: string;
  author_id: string;
  content: string;
  visibility: NoteVisibility;
  follow_up_date?: string;
  created_at: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  church_id: string;
  service_id?: string;
  group_id?: string;
  title: string;
  title_ar?: string;
  description?: string;
  assigned_to: string; // Servant or User ID
  created_by: string; // Leader or Admin ID
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  due_time?: string;
  notes?: string;
  related_member_id?: string;
  attachments?: string[];
  comments_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface CalendarEvent {
  id: string;
  church_id: string;
  service_id?: string;
  group_id?: string;
  title: string;
  title_ar?: string;
  description?: string;
  event_type: EventType;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  location?: string;
  organizer?: string;
  visibility?: 'all' | 'service_members' | 'servants_only' | 'leaders_only';
  reminder?: string;
  attachments?: string[];
  created_by: string;
  assigned_servant_ids?: string[];
  related_member_ids?: string[];
  created_at: string;
}

export type EventType = 'church_service' | 'meeting' | 'lesson' | 'activity' | 'visit' | 'task_deadline' | 'special_event';

export type LessonSubmissionStatus = 'submitted' | 'late' | 'missing';

export interface WeeklyLesson {
  id: string;
  church_id: string;
  service_id?: string;
  group_id: string;
  servant_id: string;
  title: string;
  lesson_date: string; // YYYY-MM-DD
  deadline: string; // ISO string
  submission_date?: string; // ISO string
  description?: string;
  bible_reference?: string;
  status: LessonSubmissionStatus;
  attachments: LessonAttachment[];
  leader_feedback?: string;
  created_at: string;
}

export interface LessonAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_deadline'
  | 'task_overdue'
  | 'event_upcoming'
  | 'lesson_deadline'
  | 'lesson_missing'
  | 'attendance_alert'
  | 'servant_attendance'
  | 'user_status_changed'
  | 'permission_updated';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: string;
  previous_value?: string;
  new_value?: string;
  created_at: string;
}

export interface InsightStat {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  type: 'positive' | 'warning' | 'info' | 'critical';
  metric?: string;
  action_link?: string;
}
