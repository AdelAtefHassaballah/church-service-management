# DATABASE SCHEMA MAPPING & AUDIT REFERENCE

This document serves as the **single source of truth** mapping between the PostgreSQL Supabase database schema (`supabase/schema.sql`) and the application's TypeScript types, services, API operations, and forms.

---

## 1. Organizations & Ministries

### Table: `public.churches`
Baseline organizational unit.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Baseline seed: `00000000-0000-0000-0000-000000000001` |
| `name` | TEXT | NOT NULL | `name: string` | English church name |
| `name_ar` | TEXT | NOT NULL | `name_ar: string` | Arabic church name |
| `location` | TEXT | NULL | `location?: string` | Physical address / Diocese |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | UTC ISO timestamp |

**Application Operations**:
- Read: `storage.getSettings()`, `seed.sql`

---

### Table: `public.services`
Church services, ministry stages (e.g., Preparatory, Youth, Sunday School).

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Service unique UUID |
| `church_id` | UUID | NULL, FK → `churches(id)` ON DELETE CASCADE | `church_id?: string` | Associated church UUID |
| `name` | TEXT | NOT NULL | `name: string` | Service name (EN) |
| `name_ar` | TEXT | NOT NULL | `name_ar: string` | Service name (AR) |
| `description` | TEXT | NULL | `description?: string` | Description (EN) |
| `description_ar` | TEXT | NULL | `description_ar?: string` | Description (AR) |
| `service_type` | TEXT | NOT NULL, DEFAULT `'preparatory'` | `service_type: ServiceType` | Ministry type enum/slug |
| `location` | TEXT | NULL | `location?: string` | Meeting hall / Room |
| `day_of_week` | TEXT | NULL | `day_of_week?: string` | Meeting day |
| `start_time` | TIME | NULL | `start_time?: string` | HH:MM formatted time |
| `end_time` | TIME | NULL | `end_time?: string` | HH:MM formatted time |
| `status` | TEXT | NOT NULL, DEFAULT `'active'` | `status: 'active' \| 'disabled'` | Service status |
| `color` | TEXT | DEFAULT `'#2563eb'` | `color?: string` | Hex brand color |
| `notes` | TEXT | NULL | `notes?: string` | Administrative notes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | UTC ISO timestamp |

**Application Operations**:
- Read: `serviceService.fetchAll()`, `serviceService.getAll()`, `serviceService.getById()`
- Create: `serviceService.create()` (`supabase.from('services').insert(...)`)
- Update: `serviceService.update()` (`supabase.from('services').update(...).eq('id', id)`)

---

### Table: `public.service_leaders` (Junction)
Many-to-many relationship between Services and Leaders (`profiles`).

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `service_id` | UUID | FK → `services(id)` ON DELETE CASCADE | `service_id: string` | Composite PK part 1 |
| `leader_id` | UUID | FK → `profiles(id)` ON DELETE CASCADE | `leader_id: string` | Composite PK part 2 |

**Application Operations**:
- Manage: `serviceService.create()`, `serviceService.update()`, `serviceService.fetchAll()`

---

### Table: `public.service_servants` (Junction)
Many-to-many relationship between Services and Servants (`profiles`).

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `service_id` | UUID | FK → `services(id)` ON DELETE CASCADE | `service_id: string` | Composite PK part 1 |
| `servant_id` | UUID | FK → `profiles(id)` ON DELETE CASCADE | `servant_id: string` | Composite PK part 2 |

**Application Operations**:
- Manage: `serviceService.assignServant()`, `serviceService.removeServant()`, `serviceService.assignServants()`

---

### Table: `public.service_members` (Junction)
Many-to-many relationship between Services and Members (`members`).

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `service_id` | UUID | FK → `services(id)` ON DELETE CASCADE | `service_id: string` | Composite PK part 1 |
| `member_id` | UUID | FK → `members(id)` ON DELETE CASCADE | `member_id: string` | Composite PK part 2 |

**Application Operations**:
- Manage: `serviceService.assignMember()`, `serviceService.removeMember()`, `serviceService.assignMembers()`

---

### Table: `public.member_servant_assignments`
Pastoral care assignments linking a servant to a member within a service.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Unique assignment UUID |
| `service_id` | UUID | FK → `services(id)` ON DELETE CASCADE | `service_id: string` | Service context |
| `servant_id` | UUID | FK → `profiles(id)` ON DELETE CASCADE | `servant_id: string` | Assigned servant profile ID |
| `member_id` | UUID | FK → `members(id)` ON DELETE CASCADE | `member_id: string` | Assigned member ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |

**Constraints**:
- `CONSTRAINT unique_servant_member_assignment UNIQUE (service_id, servant_id, member_id)`

**Application Operations**:
- Read: `serviceService.getMemberServantAssignments()`
- Create: `serviceService.assignMemberToServant()`
- Delete: `serviceService.removeMemberServantAssignment()`

---

## 2. Authentication & User Profiles

### Table: `public.profiles`
Extends `auth.users` with user roles, contact information, permissions, and status.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, FK → `auth.users(id)` ON DELETE CASCADE | `id: string` | Auth user ID |
| `email` | TEXT | UNIQUE, NOT NULL | `email: string` | Normalized email |
| `name` | TEXT | NOT NULL | `name: string` | Display name (EN) |
| `name_ar` | TEXT | NULL | `name_ar?: string` | Display name (AR) |
| `role` | `user_role` | NOT NULL, DEFAULT `'servant'` | `role: Role` | Enum: `super_admin`, `admin`, `leader`, `servant`, `member` |
| `avatar_url` | TEXT | NULL | `avatar_url?: string` | Storage public URL |
| `phone` | TEXT | NULL | `phone?: string` | Contact phone |
| `whatsapp` | TEXT | NULL | `whatsapp?: string` | WhatsApp phone |
| `address` | TEXT | NULL | `address?: string` | Physical address |
| `bio` | TEXT | NULL | `bio?: string` | Bio / description |
| `date_of_birth` | DATE | NULL | `date_of_birth?: string` | YYYY-MM-DD |
| `gender` | TEXT | NULL | `gender?: 'male' \| 'female'` | Gender |
| `church_id` | UUID | NULL, FK → `churches(id)` ON DELETE SET NULL | `church_id?: string` | Church ID |
| `service_ids` | TEXT[] | DEFAULT `'{}'::text[]` | `service_ids: string[]` | Array of service UUID strings |
| `permissions` | TEXT[] | DEFAULT `'{}'::text[]` | `permissions: Permission[]` | Granular action permissions |
| `status` | TEXT | NOT NULL, DEFAULT `'active'` | `status: UserStatus` | `'active'`, `'disabled'`, `'pending'` |
| `qr_code` | TEXT | UNIQUE, NOT NULL, DEFAULT `'servant:' \|\| uuid_generate_v4()` | `qr_code: string` | QR token |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `updated_at?: string` | Update timestamp |

**Application Operations**:
- Provision: RPC `public.admin_create_user`, trigger `public.handle_new_user()`
- Read: `userService.fetchAll()`, `userService.getById()`, `AuthContext.tsx`
- Update: `userService.updateUser()`, `userService.updatePermissions()`, `userService.disableAccount()`, `userService.enableAccount()`
- Delete: `userService.deleteUser()`

---

## 3. Church Members

### Table: `public.members`
Church members and youth attendees.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Member unique UUID |
| `church_id` | UUID | NULL, FK → `churches(id)` ON DELETE CASCADE | `church_id?: string` | Church UUID |
| `service_ids` | TEXT[] | DEFAULT `'{}'::text[]` | `service_ids: string[]` | Enrolled service UUIDs |
| `group_id` | TEXT | NULL | `group_id?: string` | Service stage group identifier |
| `full_name` | TEXT | NOT NULL | `full_name: string` | Full Name (EN) |
| `arabic_name` | TEXT | NOT NULL | `arabic_name: string` | Full Name (AR) |
| `photo_url` | TEXT | NULL | `photo_url?: string` | Member photo URL |
| `date_of_birth` | DATE | NULL | `date_of_birth?: string` | YYYY-MM-DD |
| `gender` | `member_gender` | NOT NULL, DEFAULT `'male'` | `gender: MemberGender` | Enum: `'male'`, `'female'` |
| `phone` | TEXT | NOT NULL | `phone: string` | Primary phone |
| `whatsapp` | TEXT | NOT NULL | `whatsapp: string` | WhatsApp phone |
| `email` | TEXT | NULL | `email?: string` | Contact email |
| `address` | TEXT | NULL | `address?: string` | Residential address |
| `emergency_contact_name` | TEXT | NULL | `emergency_contact_name?: string` | Guardian/Contact name |
| `emergency_contact_phone` | TEXT | NULL | `emergency_contact_phone?: string` | Guardian/Contact phone |
| `join_date` | DATE | NOT NULL, DEFAULT `CURRENT_DATE` | `join_date: string` | Membership join date |
| `baptism_date` | DATE | NULL | `baptism_date?: string` | Baptism date |
| `confession_father` | TEXT | NULL | `confession_father?: string` | Confession priest |
| `assigned_servant_id` | UUID | NULL, FK → `profiles(id)` ON DELETE SET NULL | `assigned_servant_id?: string` | Primary pastoral servant |
| `status` | `member_status` | NOT NULL, DEFAULT `'active'` | `status: MemberStatus` | Enum: `'active'`, `'inactive'`, `'archived'` |
| `notes` | TEXT | NULL | `notes?: string` | General remarks |
| `qr_code` | TEXT | UNIQUE, NOT NULL, DEFAULT `'member:' \|\| uuid_generate_v4()` | `qr_code: string` | QR check-in token |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `updated_at?: string` | Update timestamp |

**Application Operations**:
- Read: `memberService.fetchAll()`, `memberService.getAll()`, `memberService.getById()`, `memberService.search()`
- Create: `memberService.create()` (`supabase.from('members').insert(...)`)
- Update: `memberService.update()` (`supabase.from('members').update(...).eq('id', id)`)
- Delete: `memberService.delete()` (`supabase.from('members').delete().eq('id', id)`)
- QR: `memberService.regenerateQR()`

---

### Table: `public.member_notes`
Care history and pastoral visitation notes for members.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Note unique UUID |
| `member_id` | UUID | NOT NULL, FK → `members(id)` ON DELETE CASCADE | `member_id: string` | Target member UUID |
| `author_id` | UUID | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | `author_id: string` | Servant author profile UUID |
| `content` | TEXT | NOT NULL | `content: string` | Note content |
| `visibility` | `note_visibility` | NOT NULL, DEFAULT `'all_leaders_servants'` | `visibility: NoteVisibility` | Enum: `'servant_only'`, `'leader_only'`, `'admin_only'`, `'all_leaders_servants'` |
| `follow_up_date` | DATE | NULL | `follow_up_date?: string` | Scheduled follow-up date |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |

**Application Operations**:
- Read: `memberService.getNotes(memberId)`
- Create: `memberService.addNote(noteData)`
- Delete: `memberService.deleteNote(noteId)`

---

## 4. Attendance & Check-In

### Table: `public.attendance_records`
Member meeting and service attendance records.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Record unique UUID |
| `church_id` | UUID | NULL, FK → `churches(id)` ON DELETE CASCADE | `church_id?: string` | Church UUID |
| `service_id` | UUID | NOT NULL, FK → `services(id)` ON DELETE CASCADE | `service_id: string` | Service UUID |
| `group_id` | TEXT | NULL | `group_id?: string` | Service group |
| `session_name` | TEXT | NOT NULL, DEFAULT `'Regular Meeting'` | `session_name: string` | Meeting session type |
| `member_id` | UUID | NOT NULL, FK → `members(id)` ON DELETE CASCADE | `member_id: string` | Member UUID |
| `date` | DATE | NOT NULL | `date: string` | YYYY-MM-DD |
| `status` | `attendance_status` | NOT NULL, DEFAULT `'present'` | `status: AttendanceStatus` | Enum: `'present'`, `'absent'`, `'excused'` |
| `recorded_by` | UUID | NULL, FK → `profiles(id)` ON DELETE SET NULL | `recorded_by?: string` | Profile UUID of logger |
| `notes` | TEXT | NULL | `notes?: string` | Attendance notes / excuses |
| `method` | TEXT | NOT NULL, DEFAULT `'manual'` | `method: 'manual' \| 'qr_scan'` | Check-in method |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |

**Constraints**:
- `CONSTRAINT unique_member_attendance_per_service_date UNIQUE (member_id, service_id, date, session_name)`

**Application Operations**:
- Read: `attendanceService.getAll()`, `attendanceService.getByServiceAndDate()`, `attendanceService.getMemberHistory()`
- Upsert: `attendanceService.saveRecord()`, `attendanceService.saveBulk()`

---

### Table: `public.servant_attendance`
Servant attendance and check-in times per service meeting.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Record unique UUID |
| `church_id` | UUID | NULL, FK → `churches(id)` ON DELETE CASCADE | `church_id?: string` | Church UUID |
| `service_id` | UUID | NULL, FK → `services(id)` ON DELETE CASCADE | `service_id?: string` | Service UUID |
| `servant_id` | UUID | NULL, FK → `profiles(id)` ON DELETE CASCADE | `servant_id: string` | Servant Profile UUID |
| `date` | DATE | NOT NULL | `date: string` | YYYY-MM-DD |
| `status` | `attendance_status` | NOT NULL, DEFAULT `'present'` | `status: AttendanceStatus` | Enum: `'present'`, `'absent'`, `'excused'` |
| `check_in_time` | TEXT | NULL | `check_in_time?: string` | Scan / Check-in time |
| `recorded_by` | UUID | NULL, FK → `profiles(id)` ON DELETE SET NULL | `recorded_by?: string` | Profile UUID of logger |
| `method` | TEXT | NOT NULL, DEFAULT `'manual'` | `method: 'manual' \| 'qr_scan'` | Check-in method |
| `notes` | TEXT | NULL | `notes?: string` | Servant remarks |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |

**Constraints**:
- `CONSTRAINT unique_servant_attendance_per_date UNIQUE (service_id, servant_id, date)`

**Application Operations**:
- Read: `servantAttendanceService.fetchAll()`, `servantAttendanceService.getAll()`, `servantAttendanceService.getByDate()`
- Upsert: `servantAttendanceService.recordAttendance()`, `servantAttendanceService.saveBatch()`

---

## 5. Tasks, Weekly Lessons & Calendar

### Table: `public.tasks`
Pastoral tasks, visitation assignments, and ministry follow-ups.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Task unique UUID |
| `church_id` | UUID | NULL, FK → `churches(id)` ON DELETE CASCADE | `church_id?: string` | Church UUID |
| `service_id` | UUID | NULL, FK → `services(id)` ON DELETE SET NULL | `service_id?: string` | Service UUID |
| `group_id` | TEXT | NULL | `group_id?: string` | Service stage group |
| `title` | TEXT | NOT NULL | `title: string` | Task title (EN) |
| `title_ar` | TEXT | NULL | `title_ar?: string` | Task title (AR) |
| `description` | TEXT | NULL | `description?: string` | Detailed instructions |
| `assigned_to` | UUID | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | `assigned_to: string` | Assigned servant UUID |
| `created_by` | UUID | NULL, FK → `profiles(id)` ON DELETE SET NULL | `created_by?: string` | Creator Profile UUID |
| `priority` | `task_priority` | NOT NULL, DEFAULT `'medium'` | `priority: TaskPriority` | Enum: `'low'`, `'medium'`, `'high'`, `'urgent'` |
| `status` | `task_status` | NOT NULL, DEFAULT `'pending'` | `status: TaskStatus` | Enum: `'pending'`, `'in_progress'`, `'completed'`, `'cancelled'`, `'overdue'` |
| `due_date` | DATE | NOT NULL | `due_date: string` | Due date (YYYY-MM-DD) |
| `due_time` | TEXT | NULL | `due_time?: string` | Due time (HH:MM) |
| `notes` | TEXT | NULL | `notes?: string` | Feedback / Completion notes |
| `related_member_id` | UUID | NULL, FK → `members(id)` ON DELETE SET NULL | `related_member_id?: string` | Target member UUID |
| `attachments` | JSONB | DEFAULT `'[]'::jsonb` | `attachments?: string[]` | Uploaded attachments array |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `updated_at?: string` | Update timestamp |

**Application Operations**:
- Read: `taskService.getAll()`, `taskService.getByServant()`
- Create: `taskService.create()` (`supabase.from('tasks').insert(...)`)
- Update: `taskService.update()`, `taskService.updateStatus()` (`supabase.from('tasks').update(...).eq('id', taskId)`)
- Delete: `taskService.delete()` (`supabase.from('tasks').delete().eq('id', taskId)`)

---

### Table: `public.weekly_lessons`
Weekly Sunday School and youth lesson preparation submissions.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Lesson unique UUID |
| `church_id` | UUID | NULL, FK → `churches(id)` ON DELETE CASCADE | `church_id?: string` | Church UUID |
| `service_id` | UUID | NULL, FK → `services(id)` ON DELETE SET NULL | `service_id?: string` | Service UUID |
| `group_id` | TEXT | NULL | `group_id?: string` | Group identifier |
| `servant_id` | UUID | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | `servant_id: string` | Submitting servant UUID |
| `title` | TEXT | NOT NULL | `title: string` | Lesson topic title |
| `lesson_date` | DATE | NOT NULL | `lesson_date: string` | Sunday/Meeting date |
| `deadline` | TIMESTAMPTZ | NOT NULL | `deadline: string` | Preparation deadline |
| `submission_date` | TIMESTAMPTZ | NULL | `submission_date?: string` | Submission timestamp |
| `description` | TEXT | NULL | `description?: string` | Summary / Objectives |
| `bible_reference` | TEXT | NULL | `bible_reference?: string` | Scriptural references |
| `status` | `lesson_status` | NOT NULL, DEFAULT `'missing'` | `status: LessonSubmissionStatus` | Enum: `'submitted'`, `'late'`, `'missing'` |
| `attachments` | JSONB | DEFAULT `'[]'::jsonb` | `attachments: LessonAttachment[]` | Array of attachment objects |
| `leader_feedback` | TEXT | NULL | `leader_feedback?: string` | Leader remarks |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |

**Application Operations**:
- Read: `lessonService.getAll()`, `lessonService.getByServant()`, `lessonService.getByDate()`
- Submit/Upsert: `lessonService.submitLesson()` (`supabase.from('weekly_lessons').upsert(...)`)
- Feedback: `lessonService.addFeedback()` (`supabase.from('weekly_lessons').update(...).eq('id', lessonId)`)

---

### Table: `public.calendar_events`
Church service events, liturgical dates, and pastoral activities.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Event unique UUID |
| `church_id` | UUID | NULL, FK → `churches(id)` ON DELETE CASCADE | `church_id?: string` | Church UUID |
| `service_id` | UUID | NULL, FK → `services(id)` ON DELETE SET NULL | `service_id?: string` | Service UUID |
| `group_id` | TEXT | NULL | `group_id?: string` | Stage group |
| `title` | TEXT | NOT NULL | `title: string` | Event title (EN) |
| `title_ar` | TEXT | NULL | `title_ar?: string` | Event title (AR) |
| `description` | TEXT | NULL | `description?: string` | Event description |
| `event_type` | TEXT | NOT NULL, DEFAULT `'church_service'` | `event_type: EventType` | Event category |
| `date` | DATE | NOT NULL | `date: string` | Event date (YYYY-MM-DD) |
| `start_time` | TIME | NOT NULL | `start_time: string` | HH:MM |
| `end_time` | TIME | NOT NULL | `end_time: string` | HH:MM |
| `location` | TEXT | NULL | `location?: string` | Location |
| `organizer` | TEXT | NULL | `organizer?: string` | Organizer name |
| `visibility` | TEXT | NOT NULL, DEFAULT `'all'` | `visibility?: string` | Target audience |
| `reminder` | TEXT | NULL | `reminder?: string` | Notification trigger |
| `attachments` | JSONB | DEFAULT `'[]'::jsonb` | `attachments?: string[]` | Attached documents |
| `created_by` | UUID | NULL, FK → `profiles(id)` ON DELETE SET NULL | `created_by?: string` | Creator Profile UUID |
| `assigned_servant_ids` | JSONB | DEFAULT `'[]'::jsonb` | `assigned_servant_ids?: string[]` | Servant UUIDs array |
| `related_member_ids` | JSONB | DEFAULT `'[]'::jsonb` | `related_member_ids?: string[]` | Member UUIDs array |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |

**Application Operations**:
- Read: `calendarService.getAll()`, `calendarService.getByService()`, `calendarService.getByDate()`
- Create: `calendarService.create()` (`supabase.from('calendar_events').insert(...)`)
- Update: `calendarService.update()` (`supabase.from('calendar_events').update(...).eq('id', id)`)
- Delete: `calendarService.delete()` (`supabase.from('calendar_events').delete().eq('id', id)`)

---

## 6. QR Management & Audit Trails

### Table: `public.qr_codes`
Opaque QR identification tokens (Zero PII).

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | QR unique UUID |
| `entity_type` | `qr_entity_type` | NOT NULL | `entity_type: QRCodeEntityType` | Enum: `'member'`, `'servant'`, `'user'` |
| `entity_id` | UUID | NOT NULL | `entity_id: string` | Target entity UUID |
| `token` | TEXT | UNIQUE, NOT NULL | `token: string` | Token identifier string |
| `status` | TEXT | NOT NULL, DEFAULT `'active'` | `status: 'active' \| 'disabled'` | Token active status |
| `service_ids` | TEXT[] | DEFAULT `'{}'::text[]` | `service_ids: string[]` | Valid service UUIDs |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |
| `last_scanned_at` | TIMESTAMPTZ | NULL | `last_scanned_at?: string` | Last scan timestamp |

**Application Operations**:
- Read: `qrService.getAll()`, `qrService.fetchAll()`
- Upsert/Regenerate: `qrService.regenerateQR()`
- Update Status: `qrService.disableQR()`, `qrService.enableQR()`

---

### Table: `public.audit_logs`
Append-only system security and administrative audit log.

| Column | PostgreSQL Type | Constraints | Application Field | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | `id: string` | Log unique UUID |
| `user_id` | UUID | NULL, FK → `profiles(id)` ON DELETE SET NULL | `user_id?: string` | Actor Profile UUID |
| `user_name` | TEXT | NOT NULL | `user_name: string` | Actor display name |
| `action` | TEXT | NOT NULL | `action: string` | Action code slug |
| `entity_type` | TEXT | NOT NULL | `entity_type: string` | Target entity type |
| `entity_id` | TEXT | NULL | `entity_id?: string` | Target entity ID string |
| `details` | TEXT | NULL | `details: string` | Human-readable log details |
| `previous_value` | TEXT | NULL | `previous_value?: string` | Pre-change value |
| `new_value` | TEXT | NULL | `new_value?: string` | Post-change value |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | `created_at: string` | Creation timestamp |

**Application Operations**:
- Read: `storage.getAuditLogs()`, `AuditLogsPage.tsx`
- Insert: `storage.logAction()`, `schema.sql` triggers and RPCs
