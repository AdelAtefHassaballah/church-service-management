import { Permission, Role, UserProfile } from '../types';

export interface PermissionGroup {
  id: string;
  label_en: string;
  label_ar: string;
  permissions: {
    key: Permission;
    label_en: string;
    label_ar: string;
    description_en: string;
    description_ar: string;
  }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'members',
    label_en: 'Members Management',
    label_ar: 'إدارة المخدومين والأعضاء',
    permissions: [
      { key: 'members.view', label_en: 'View Members', label_ar: 'عرض المخدومين', description_en: 'View member directory and profiles', description_ar: 'الاطلاع على دليل وبيانات المخدومين' },
      { key: 'members.create', label_en: 'Add Members', label_ar: 'إضافة مخدوم جديد', description_en: 'Create new member profiles', description_ar: 'تسجيل مخدومين جدد بالمنظومة' },
      { key: 'members.edit', label_en: 'Edit Members', label_ar: 'تعديل بيانات المخدومين', description_en: 'Modify member info and assignments', description_ar: 'تعديل بيانات ورعاية المخدومين' },
      { key: 'members.delete', label_en: 'Delete Members', label_ar: 'حذف المخدومين', description_en: 'Permanently remove member profiles', description_ar: 'حذف مخدومين من النظام' },
    ],
  },
  {
    id: 'attendance',
    label_en: 'Attendance & Check-in',
    label_ar: 'تسجيل الحضور والغياب',
    permissions: [
      { key: 'attendance.view', label_en: 'View Attendance', label_ar: 'عرض سجلات الحضور', description_en: 'View past attendance records', description_ar: 'الاطلاع على سجلات الحضور السابقة' },
      { key: 'attendance.create', label_en: 'Take Attendance', label_ar: 'تسجيل الحضور (يدوي/QR)', description_en: 'Record manual or QR attendance', description_ar: 'تسجيل حضور المخدومين والخدام' },
      { key: 'attendance.edit', label_en: 'Edit Attendance', label_ar: 'تعديل سجل الحضور', description_en: 'Update historical attendance status', description_ar: 'تعديل حالات الحضور المسجلة' },
      { key: 'attendance.delete', label_en: 'Delete Attendance', label_ar: 'حذف سجلات الحضور', description_en: 'Delete recorded attendance batches', description_ar: 'حذف سجلات الحضور' },
    ],
  },
  {
    id: 'services',
    label_en: 'Church Services & Stages',
    label_ar: 'إدارة أسرات وقطاعات الخدمة',
    permissions: [
      { key: 'services.view', label_en: 'View Services', label_ar: 'عرض قطاعات الخدمة', description_en: 'View church services directory', description_ar: 'الاطلاع على خدمات وأسرات الكنيسة' },
      { key: 'services.create', label_en: 'Create Service', label_ar: 'إنشاء خدمة جديدة', description_en: 'Add new ministry / stage service', description_ar: 'إنشاء أسرة أو خدمة جديدة' },
      { key: 'services.edit', label_en: 'Edit Service', label_ar: 'تعديل الخدمة والتعيينات', description_en: 'Assign leaders, servants, members', description_ar: 'تعديل وتعيين الخدام والمخدومين' },
      { key: 'services.delete', label_en: 'Delete Service', label_ar: 'حذف / تعطيل الخدمة', description_en: 'Archive or remove church services', description_ar: 'حذف أو تعطيل قطاع خدمة' },
    ],
  },
  {
    id: 'lessons',
    label_en: 'Weekly Lessons Preparation',
    label_ar: 'تحضير الدروس الأسبوعية',
    permissions: [
      { key: 'lessons.view', label_en: 'View Lessons', label_ar: 'عرض تحضير الدروس', description_en: 'View weekly lessons submissions', description_ar: 'الاطلاع على تحضيرات الدروس' },
      { key: 'lessons.create', label_en: 'Submit Lessons', label_ar: 'رفع وتسليم التحضير', description_en: 'Submit weekly lesson preparation', description_ar: 'تسليم ورفع تحضير درس مدارس الأحد' },
      { key: 'lessons.edit', label_en: 'Review & Feedback', label_ar: 'تقييم وإضافة ملاحظات', description_en: 'Provide leader feedback on lessons', description_ar: 'إضافة تقييم وملاحظات أمين الخدمة' },
      { key: 'lessons.delete', label_en: 'Delete Lessons', label_ar: 'حذف الدروس', description_en: 'Remove lesson preparations', description_ar: 'حذف ملفات تحضير الدروس' },
    ],
  },
  {
    id: 'tasks',
    label_en: 'Tasks & Follow-ups',
    label_ar: 'المهام والافتقادات الرعوية',
    permissions: [
      { key: 'tasks.view', label_en: 'View Tasks', label_ar: 'عرض المهام', description_en: 'View assigned duties and follow-ups', description_ar: 'عرض التكليفات والافتقادات' },
      { key: 'tasks.create', label_en: 'Assign Tasks', label_ar: 'إسناد مهام للخدام', description_en: 'Create and assign duties to servants', description_ar: 'إنشاء وإسناد مهام للخدام' },
      { key: 'tasks.edit', label_en: 'Update Task Status', label_ar: 'تحديث حالة المهمة', description_en: 'Modify progress and details', description_ar: 'تعديل وتحديث مراحل تنفيذ المهام' },
      { key: 'tasks.delete', label_en: 'Delete Tasks', label_ar: 'حذف المهام', description_en: 'Remove tasks from board', description_ar: 'حذف المهام' },
    ],
  },
  {
    id: 'users',
    label_en: 'User & Access Management',
    label_ar: 'إدارة المستخدمين والحسابات',
    permissions: [
      { key: 'users.view', label_en: 'View Users Directory', label_ar: 'عرض قائمة المستخدمين', description_en: 'View accounts, roles and status', description_ar: 'عرض حسابات الخدام والأمناء' },
      { key: 'users.create', label_en: 'Create Users / Servants', label_ar: 'إضافة خادم أو مستخدم', description_en: 'Create new login accounts', description_ar: 'إنشاء حسابات مستخدمين وخدام جدد' },
      { key: 'users.edit', label_en: 'Edit Roles & Permissions', label_ar: 'تعديل الصلاحيات والأدوار', description_en: 'Change user roles and permissions', description_ar: 'تعديل الأدوار والصلاحيات الفردية' },
      { key: 'users.disable', label_en: 'Disable / Enable Accounts', label_ar: 'تعطيل وتفعيل الحسابات', description_en: 'Manage soft login access without data loss', description_ar: 'إيقاف وتفعيل الدخول مع حفظ البيانات' },
      { key: 'users.delete', label_en: 'Delete Users', label_ar: 'حذف الحسابات', description_en: 'Delete user accounts', description_ar: 'حذف الحسابات' },
    ],
  },
  {
    id: 'system',
    label_en: 'Analytics, Reports & Settings',
    label_ar: 'الإحصائيات والتقارير والإعدادات',
    permissions: [
      { key: 'analytics.view', label_en: 'View Analytics', label_ar: 'عرض الإحصائيات الذكية', description_en: 'Access service insights & charts', description_ar: 'الاطلاع على الرؤى والمؤشرات البيانية' },
      { key: 'reports.view', label_en: 'Export Reports', label_ar: 'تصدير التقارير (CSV)', description_en: 'Download attendance and member reports', description_ar: 'استخراج وتصدير ملفات التقارير' },
      { key: 'qr.manage', label_en: 'Manage QR Codes', label_ar: 'إدارة وتوليد أكواد QR', description_en: 'Generate, print & regenerate QR cards', description_ar: 'إدارة وطباعة كارنيهات الباركود' },
      { key: 'settings.manage', label_en: 'Manage Church Settings', label_ar: 'إدارة إعدادات الكنيسة', description_en: 'Configure deadlines, church profile, and logs', description_ar: 'ضبط بيانات الكنيسة ومواعيد الإغلاق' },
    ],
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'members.view', 'members.create', 'members.edit', 'members.delete',
    'attendance.view', 'attendance.create', 'attendance.edit', 'attendance.delete',
    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
    'events.view', 'events.create', 'events.edit', 'events.delete',
    'lessons.view', 'lessons.create', 'lessons.edit', 'lessons.delete',
    'services.view', 'services.create', 'services.edit', 'services.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.disable',
    'analytics.view', 'reports.view', 'settings.manage', 'qr.manage',
  ],
  admin: [
    'members.view', 'members.create', 'members.edit', 'members.delete',
    'attendance.view', 'attendance.create', 'attendance.edit', 'attendance.delete',
    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
    'events.view', 'events.create', 'events.edit', 'events.delete',
    'lessons.view', 'lessons.create', 'lessons.edit', 'lessons.delete',
    'services.view', 'services.create', 'services.edit',
    'users.view', 'users.create', 'users.edit', 'users.disable',
    'analytics.view', 'reports.view', 'settings.manage', 'qr.manage',
  ],
  leader: [
    'members.view', 'members.create', 'members.edit',
    'attendance.view', 'attendance.create', 'attendance.edit',
    'tasks.view', 'tasks.create', 'tasks.edit',
    'events.view', 'events.create', 'events.edit',
    'lessons.view', 'lessons.create', 'lessons.edit',
    'services.view', 'services.edit',
    'users.view',
    'analytics.view', 'reports.view', 'qr.manage',
  ],
  servant: [
    'members.view',
    'attendance.view', 'attendance.create',
    'tasks.view', 'tasks.edit',
    'events.view',
    'lessons.view', 'lessons.create',
    'services.view',
  ],
  member: [
    'events.view',
  ],
};

export function hasPermission(user: UserProfile | null, permission: Permission): boolean {
  if (!user) return false;
  if (user.status === 'disabled') return false;
  // Super Admin overrides all permission checks
  if (user.role === 'super_admin') return true;

  if (user.permissions && user.permissions.includes(permission)) {
    return true;
  }

  // Fallback to role default permissions
  const roleDefaults = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  return roleDefaults.includes(permission);
}
