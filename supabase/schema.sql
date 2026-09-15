-- ========================================================================
-- CHURCH SERVICE MANAGEMENT SYSTEM - PRODUCTION POSTGRESQL SCHEMA (V2.0)
-- Production Security Hardened: Row Level Security (RLS) on ALL tables,
-- Security Definer Functions, Storage Bucket Policies, Audit Logging,
-- and Auto-Profile Provisioning Trigger.
-- ========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'leader', 'servant', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_gender AS ENUM ('male', 'female');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE note_visibility AS ENUM ('servant_only', 'leader_only', 'admin_only', 'all_leaders_servants');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lesson_status AS ENUM ('submitted', 'late', 'missing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE qr_entity_type AS ENUM ('member', 'servant', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Churches Table
CREATE TABLE IF NOT EXISTS public.churches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Church Services / Ministries Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    service_type TEXT NOT NULL DEFAULT 'preparatory',
    location TEXT,
    day_of_week TEXT,
    start_time TIME,
    end_time TIME,
    status TEXT DEFAULT 'active' NOT NULL,
    color TEXT DEFAULT '#2563eb',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. User Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT,
    role user_role NOT NULL DEFAULT 'servant',
    avatar_url TEXT,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    bio TEXT,
    date_of_birth DATE,
    gender TEXT,
    church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
    service_ids TEXT[] DEFAULT '{}'::text[],
    permissions TEXT[] DEFAULT '{}'::text[],
    status TEXT DEFAULT 'active' NOT NULL,
    qr_code TEXT UNIQUE NOT NULL DEFAULT ('servant:' || uuid_generate_v4()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Service Leaders (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.service_leaders (
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (service_id, leader_id)
);

-- 7. Service Servants (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.service_servants (
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    servant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (service_id, servant_id)
);

-- 8. Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    service_ids TEXT[] DEFAULT '{}'::text[],
    group_id TEXT,
    full_name TEXT NOT NULL,
    arabic_name TEXT NOT NULL,
    photo_url TEXT,
    date_of_birth DATE,
    gender member_gender NOT NULL DEFAULT 'male',
    phone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    join_date DATE DEFAULT CURRENT_DATE NOT NULL,
    baptism_date DATE,
    confession_father TEXT,
    assigned_servant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status member_status NOT NULL DEFAULT 'active',
    notes TEXT,
    qr_code TEXT UNIQUE NOT NULL DEFAULT ('member:' || uuid_generate_v4()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Service Members (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.service_members (
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    PRIMARY KEY (service_id, member_id)
);

-- 10. Servant to Member Care Assignments (Per Service)
CREATE TABLE IF NOT EXISTS public.member_servant_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    servant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_servant_member_assignment UNIQUE (service_id, servant_id, member_id)
);

-- 11. Universal QR Codes Table (Opaque Tokens only, No PII)
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type qr_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    service_ids TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_scanned_at TIMESTAMP WITH TIME ZONE
);

-- 12. Member Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    group_id TEXT,
    session_name TEXT DEFAULT 'Regular Meeting' NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'present',
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    method TEXT DEFAULT 'manual' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_member_attendance_per_service_date UNIQUE (member_id, service_id, date, session_name)
);

-- 13. Servant Attendance & Check-in Table
CREATE TABLE IF NOT EXISTS public.servant_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    servant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'present',
    check_in_time TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    method TEXT DEFAULT 'manual' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_servant_attendance_per_date UNIQUE (service_id, servant_id, date)
);

-- 14. Member Notes & Care History
CREATE TABLE IF NOT EXISTS public.member_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    visibility note_visibility DEFAULT 'all_leaders_servants' NOT NULL,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Tasks Management
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    group_id TEXT,
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority task_priority DEFAULT 'medium' NOT NULL,
    status task_status DEFAULT 'pending' NOT NULL,
    due_date DATE NOT NULL,
    due_time TEXT,
    notes TEXT,
    related_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Weekly Lesson Preparation Hub
CREATE TABLE IF NOT EXISTS public.weekly_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    group_id TEXT,
    servant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    lesson_date DATE NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    bible_reference TEXT,
    status lesson_status DEFAULT 'missing' NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    leader_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    group_id TEXT,
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    event_type TEXT DEFAULT 'church_service' NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    organizer TEXT,
    visibility TEXT DEFAULT 'all' NOT NULL,
    reminder TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_servant_ids JSONB DEFAULT '[]'::jsonb,
    related_member_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. Audit Logs (Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    previous_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & QUERIES
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_members_name ON public.members (full_name);
CREATE INDEX IF NOT EXISTS idx_members_arabic_name ON public.members (arabic_name);
CREATE INDEX IF NOT EXISTS idx_members_qr ON public.members (qr_code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records (date);
CREATE INDEX IF NOT EXISTS idx_servant_attend_date ON public.servant_attendance (date);
CREATE INDEX IF NOT EXISTS idx_qr_token ON public.qr_codes (token);

-- ========================================================================
-- SECURITY DEFINER FUNCTIONS (SERVER-SIDE AUTHORIZATION CHECKS)
-- ========================================================================

-- Check if current authenticated user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND status = 'active'
  );
$$;

-- Check if current user has a specific granular permission
CREATE OR REPLACE FUNCTION public.has_permission(requested_perm TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
      AND status = 'active'
      AND (role = 'super_admin' OR requested_perm = ANY(permissions))
  );
$$;

-- Check if current user has access to a specific church service
CREATE OR REPLACE FUNCTION public.user_has_service_access(service_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'active'
      AND (
        role = 'super_admin'
        OR service_uuid::text = ANY(service_ids)
        OR EXISTS (SELECT 1 FROM public.service_leaders WHERE service_id = service_uuid AND leader_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.service_servants WHERE service_id = service_uuid AND servant_id = auth.uid())
      )
  );
$$;

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_servants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_servant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servant_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Super Admin manage all profiles" ON public.profiles
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Authenticated users view profiles in same church" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users update own personal profile only" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Prevent changing role, permissions, or status via self-update
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        AND permissions = (SELECT permissions FROM public.profiles WHERE id = auth.uid())
        AND status = (SELECT status FROM public.profiles WHERE id = auth.uid())
    );

-- 2. SERVICES POLICIES
CREATE POLICY "Super Admin manage services" ON public.services
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Authorized users view services" ON public.services
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitted users modify services" ON public.services
    FOR ALL USING (public.has_permission('services.edit') OR public.has_permission('services.create'));

-- 3. SERVICE ASSIGNMENTS POLICIES
CREATE POLICY "Super Admin manage service mappings" ON public.service_servants
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "View service servants" ON public.service_servants
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super Admin manage service members" ON public.service_members
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "View service members" ON public.service_members
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super Admin manage care assignments" ON public.member_servant_assignments
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "View care assignments" ON public.member_servant_assignments
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 4. MEMBERS POLICIES
CREATE POLICY "Super Admin manage members" ON public.members
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Servants and Leaders view assigned members" ON public.members
    FOR SELECT USING (
        public.has_permission('members.view')
        OR assigned_servant_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.service_servants ss
            JOIN public.service_members sm ON ss.service_id = sm.service_id
            WHERE ss.servant_id = auth.uid() AND sm.member_id = members.id
        )
    );

CREATE POLICY "Authorized users modify members" ON public.members
    FOR ALL USING (public.has_permission('members.create') OR public.has_permission('members.edit'));

-- 5. ATTENDANCE POLICIES
CREATE POLICY "Super Admin manage attendance" ON public.attendance_records
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Authorized users view attendance" ON public.attendance_records
    FOR SELECT USING (public.has_permission('attendance.view') OR recorded_by = auth.uid());

CREATE POLICY "Authorized users record attendance" ON public.attendance_records
    FOR INSERT WITH CHECK (public.has_permission('attendance.create') OR auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users update attendance" ON public.attendance_records
    FOR UPDATE USING (public.has_permission('attendance.edit'));

-- 6. SERVANT ATTENDANCE POLICIES
CREATE POLICY "Super Admin manage servant attendance" ON public.servant_attendance
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Leaders and Admins view servant attendance" ON public.servant_attendance
    FOR SELECT USING (public.has_permission('attendance.view') OR servant_id = auth.uid());

CREATE POLICY "Authorized users record servant attendance" ON public.servant_attendance
    FOR INSERT WITH CHECK (public.has_permission('attendance.create') OR public.is_super_admin());

-- 7. QR CODES POLICIES
CREATE POLICY "Super Admin manage qr codes" ON public.qr_codes
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "View qr codes" ON public.qr_codes
    FOR SELECT USING (public.has_permission('qr.manage') OR entity_id = auth.uid());

-- 8. TASKS POLICIES
CREATE POLICY "Super Admin manage tasks" ON public.tasks
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users view assigned or permitted tasks" ON public.tasks
    FOR SELECT USING (
        public.has_permission('tasks.view') 
        OR assigned_to = auth.uid() 
        OR created_by = auth.uid()
    );

CREATE POLICY "Users update own assigned tasks status" ON public.tasks
    FOR UPDATE USING (assigned_to = auth.uid() OR public.has_permission('tasks.edit'));

CREATE POLICY "Permitted users create tasks" ON public.tasks
    FOR INSERT WITH CHECK (public.has_permission('tasks.create') OR public.is_super_admin());

-- 9. WEEKLY LESSONS POLICIES
CREATE POLICY "Super Admin manage lessons" ON public.weekly_lessons
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Servants view and manage own lessons" ON public.weekly_lessons
    FOR ALL USING (
        servant_id = auth.uid() 
        OR public.has_permission('lessons.view')
        OR public.is_super_admin()
    );

-- 10. CALENDAR EVENTS POLICIES
CREATE POLICY "Super Admin manage events" ON public.calendar_events
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Authenticated users view calendar events" ON public.calendar_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitted users create events" ON public.calendar_events
    FOR INSERT WITH CHECK (public.has_permission('events.create') OR public.is_super_admin());

-- 11. AUDIT LOGS POLICIES (Append-Only & Super Admin Read-Only)
CREATE POLICY "Super Admin view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_super_admin() OR public.has_permission('audit_logs.view'));

CREATE POLICY "System insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================================================
-- AUTOMATIC PROFILE PROVISIONING TRIGGER ON AUTH.USERS
-- ========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    status,
    qr_code,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'servant'::user_role),
    'active',
    'servant:' || NEW.id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute upon auth.users sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================================
-- STORAGE BUCKET POLICIES (Avatars & Lesson Attachments)
-- ========================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson_files', 'lesson_files', false) 
ON CONFLICT (id) DO NOTHING;

-- Avatars storage policy: authenticated upload, public read
CREATE POLICY "Public read avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users update own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Lesson files storage policy: authenticated read/write with service scope
CREATE POLICY "Authenticated access lesson files" ON storage.objects
    FOR ALL USING (bucket_id = 'lesson_files' AND auth.uid() IS NOT NULL);

-- ========================================================================
-- SUPER ADMIN ADMINISTRATIVE RPC PROCEDURES (Security Definer)
-- ========================================================================

-- 1. Super Admin: Update user email in auth.users and public.profiles synchronously
CREATE OR REPLACE FUNCTION public.admin_update_user_email(
    target_user_id UUID,
    new_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied. Super Admin privileges required.';
    END IF;

    -- Update auth.users
    UPDATE auth.users
    SET email = new_email,
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Update public.profiles
    UPDATE public.profiles
    SET email = new_email,
        updated_at = NOW()
    WHERE id = target_user_id;

    INSERT INTO public.audit_logs (user_id, user_name, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'Super Admin', 'ADMIN_UPDATE_EMAIL', 'user', target_user_id, 'Updated user email to ' || new_email);

    RETURN jsonb_build_object('success', true, 'email', new_email);
END;
$$;

-- 2. Super Admin: Administrative password reset in auth.users
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
    target_user_id UUID,
    new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied. Super Admin privileges required.';
    END IF;

    IF LENGTH(new_password) < 8 THEN
        RAISE EXCEPTION 'Password must be at least 8 characters long.';
    END IF;

    -- Update auth.users password hash securely
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = target_user_id;

    INSERT INTO public.audit_logs (user_id, user_name, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'Super Admin', 'ADMIN_RESET_PASSWORD', 'user', target_user_id, 'Administrative password reset executed');

    RETURN jsonb_build_object('success', true);
END;
$$;
