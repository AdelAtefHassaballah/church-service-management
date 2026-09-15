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

const STORAGE_KEYS = {
  PROFILES: 'khedma_prod_profiles',
  SERVICES: 'khedma_prod_services',
  GROUPS: 'khedma_prod_groups',
  MEMBERS: 'khedma_prod_members',
  ATTENDANCE: 'khedma_prod_attendance',
  SERVANT_ATTENDANCE: 'khedma_prod_servant_attendance',
  QR_CODES: 'khedma_prod_qr_codes',
  ASSIGNMENTS: 'khedma_prod_assignments',
  LESSONS: 'khedma_prod_lessons',
  TASKS: 'khedma_prod_tasks',
  EVENTS: 'khedma_prod_events',
  NOTIFICATIONS: 'khedma_prod_notifications',
  AUDIT_LOGS: 'khedma_prod_audit_logs',
  SETTINGS: 'khedma_prod_settings',
  ACTIVE_USER: 'khedma_prod_active_user',
};

// Safe LocalStorage helpers
function load<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

const DEFAULT_SUPER_ADMIN: UserProfile = {
  id: 'usr-super-admin-1',
  email: 'adelgerges@church.org',
  name: 'Adel Gerges',
  name_ar: 'عادل عاطف',
  role: 'super_admin',
  status: 'active',
  qr_code: 'servant:usr-super-admin-1',
  service_ids: ['svc-prep', 'svc-sec', 'svc-youth', 'svc-child'],
  permissions: [
    'members.view', 'members.create', 'members.edit', 'members.delete',
    'attendance.view', 'attendance.create', 'attendance.edit', 'attendance.delete',
    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
    'events.view', 'events.create', 'events.edit', 'events.delete',
    'lessons.view', 'lessons.create', 'lessons.edit', 'lessons.delete',
    'services.view', 'services.create', 'services.edit', 'services.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.disable',
    'analytics.view', 'reports.view', 'settings.manage', 'qr.manage'
  ],
  created_at: new Date().toISOString()
};

export const storage = {
  // Clear all cached local data
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  },

  // Active User / Auth
  getActiveUser: (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },
  setActiveUser: (user: UserProfile | null) => {
    if (user) {
      save(STORAGE_KEYS.ACTIVE_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    }
  },

  // Profiles & Users
  getProfiles: (): UserProfile[] => {
    const list = load<UserProfile[]>(STORAGE_KEYS.PROFILES, [DEFAULT_SUPER_ADMIN]);
    if (list.length === 0) {
      save(STORAGE_KEYS.PROFILES, [DEFAULT_SUPER_ADMIN]);
      return [DEFAULT_SUPER_ADMIN];
    }
    return list;
  },
  getProfileById: (id: string): UserProfile | undefined => {
    return storage.getProfiles().find(p => p.id === id);
  },
  saveProfile: (profile: UserProfile) => {
    const profiles = storage.getProfiles();
    const idx = profiles.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    save(STORAGE_KEYS.PROFILES, profiles);
  },
  deleteProfile: (id: string) => {
    const profiles = storage.getProfiles().filter(p => p.id !== id);
    save(STORAGE_KEYS.PROFILES, profiles);
  },

  // Church Services
  getServices: (): ChurchService[] => {
    return load<ChurchService[]>(STORAGE_KEYS.SERVICES, []);
  },
  getServiceById: (id: string): ChurchService | undefined => {
    return storage.getServices().find(s => s.id === id);
  },
  saveService: (service: ChurchService) => {
    const services = storage.getServices();
    const idx = services.findIndex(s => s.id === service.id);
    if (idx >= 0) {
      services[idx] = service;
    } else {
      services.push(service);
    }
    save(STORAGE_KEYS.SERVICES, services);
  },
  deleteService: (id: string) => {
    const services = storage.getServices().filter(s => s.id !== id);
    save(STORAGE_KEYS.SERVICES, services);
  },

  // Service Groups
  getGroups: (): ServiceGroup[] => {
    return load<ServiceGroup[]>(STORAGE_KEYS.GROUPS, []);
  },
  saveGroup: (group: ServiceGroup) => {
    const groups = storage.getGroups();
    const idx = groups.findIndex(g => g.id === group.id);
    if (idx >= 0) {
      groups[idx] = group;
    } else {
      groups.push(group);
    }
    save(STORAGE_KEYS.GROUPS, groups);
  },

  // Members
  getMembers: (): Member[] => {
    return load<Member[]>(STORAGE_KEYS.MEMBERS, []);
  },
  getMemberById: (id: string): Member | undefined => {
    return storage.getMembers().find(m => m.id === id);
  },
  saveMember: (member: Member) => {
    const members = storage.getMembers();
    const idx = members.findIndex(m => m.id === member.id);
    if (idx >= 0) {
      members[idx] = member;
    } else {
      members.push(member);
    }
    save(STORAGE_KEYS.MEMBERS, members);
  },
  deleteMember: (id: string) => {
    const members = storage.getMembers().filter(m => m.id !== id);
    save(STORAGE_KEYS.MEMBERS, members);
  },

  // Attendance
  getAttendance: (): AttendanceRecord[] => {
    return load<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  },
  saveAttendanceRecord: (record: AttendanceRecord) => {
    const attendance = storage.getAttendance();
    const idx = attendance.findIndex(a => a.member_id === record.member_id && a.date === record.date);
    if (idx >= 0) {
      attendance[idx] = record;
    } else {
      attendance.push(record);
    }
    save(STORAGE_KEYS.ATTENDANCE, attendance);
  },
  saveAttendanceBulk: (records: AttendanceRecord[]) => {
    const attendance = storage.getAttendance();
    for (const r of records) {
      const idx = attendance.findIndex(a => a.member_id === r.member_id && a.date === r.date);
      if (idx >= 0) {
        attendance[idx] = r;
      } else {
        attendance.push(r);
      }
    }
    save(STORAGE_KEYS.ATTENDANCE, attendance);
  },
  saveBulkAttendance: (records: AttendanceRecord[]) => {
    storage.saveAttendanceBulk(records);
  },

  // Servant Attendance
  getServantAttendance: (): ServantAttendanceRecord[] => {
    return load<ServantAttendanceRecord[]>(STORAGE_KEYS.SERVANT_ATTENDANCE, []);
  },
  saveServantAttendance: (record: ServantAttendanceRecord) => {
    const list = storage.getServantAttendance();
    const idx = list.findIndex(r => r.servant_id === record.servant_id && r.date === record.date && r.service_id === record.service_id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    save(STORAGE_KEYS.SERVANT_ATTENDANCE, list);
  },

  // QR Codes
  getQRCodes: (): QRCodeRecord[] => {
    return load<QRCodeRecord[]>(STORAGE_KEYS.QR_CODES, []);
  },
  saveQRCode: (record: QRCodeRecord) => {
    const list = storage.getQRCodes();
    const idx = list.findIndex(q => q.id === record.id || q.entity_id === record.entity_id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    save(STORAGE_KEYS.QR_CODES, list);
  },

  // Weekly Lessons
  getLessons: (): WeeklyLesson[] => {
    return load<WeeklyLesson[]>(STORAGE_KEYS.LESSONS, []);
  },
  saveLesson: (lesson: WeeklyLesson) => {
    const lessons = storage.getLessons();
    const idx = lessons.findIndex(l => l.id === lesson.id);
    if (idx >= 0) {
      lessons[idx] = lesson;
    } else {
      lessons.push(lesson);
    }
    save(STORAGE_KEYS.LESSONS, lessons);
  },

  // Tasks
  getTasks: (): Task[] => {
    return load<Task[]>(STORAGE_KEYS.TASKS, []);
  },
  saveTask: (task: Task) => {
    const tasks = storage.getTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.push(task);
    }
    save(STORAGE_KEYS.TASKS, tasks);
  },
  deleteTask: (id: string) => {
    const tasks = storage.getTasks().filter(t => t.id !== id);
    save(STORAGE_KEYS.TASKS, tasks);
  },

  // Calendar Events
  getEvents: (): CalendarEvent[] => {
    return load<CalendarEvent[]>(STORAGE_KEYS.EVENTS, []);
  },
  saveEvent: (event: CalendarEvent) => {
    const events = storage.getEvents();
    const idx = events.findIndex(e => e.id === event.id);
    if (idx >= 0) {
      events[idx] = event;
    } else {
      events.push(event);
    }
    save(STORAGE_KEYS.EVENTS, events);
  },
  deleteEvent: (id: string) => {
    const events = storage.getEvents().filter(e => e.id !== id);
    save(STORAGE_KEYS.EVENTS, events);
  },

  // Notifications
  getNotifications: (): AppNotification[] => {
    return load<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  addNotification: (notification: AppNotification) => {
    const notifs = storage.getNotifications();
    notifs.unshift(notification);
    save(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },
  markNotificationAsRead: (id: string) => {
    const notifs = storage.getNotifications();
    const target = notifs.find(n => n.id === id);
    if (target) {
      target.read = true;
      save(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  },
  markAllNotificationsAsRead: (userId?: string) => {
    const notifs = storage.getNotifications().map(n => {
      if (!userId || n.user_id === userId || n.user_id === 'all') {
        return { ...n, read: true };
      }
      return n;
    });
    save(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  // Audit Logs (Append-Only)
  getAuditLogs: (): AuditLog[] => {
    return load<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },
  logAction: (action: string, entity_type: string, details: string, entity_id?: string, previous_value?: string, new_value?: string) => {
    const active = storage.getActiveUser();
    const logs = storage.getAuditLogs();
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_id: active?.id || 'system',
      user_name: active?.name || 'System / Service',
      action,
      entity_type,
      entity_id,
      details,
      previous_value,
      new_value,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    save(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  // Settings
  getSettings: () => {
    return load(STORAGE_KEYS.SETTINGS, {
      church_name: 'St. Mark & St. George Coptic Orthodox Church',
      church_name_ar: 'كنيسة الشهيد العظيم مارمرقس والشهيد مارجرجس',
      weekly_deadline_day: 'thursday',
      weekly_deadline_time: '20:00',
    });
  },
  saveSettings: (settings: any) => {
    save(STORAGE_KEYS.SETTINGS, settings);
  }
};
