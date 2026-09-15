-- ========================================================================
-- PRODUCTION SUPER ADMIN BOOTSTRAP SCRIPT
-- Run this script in the Supabase SQL Editor to initialize the first
-- Super Admin account for your church production environment.
-- ========================================================================

-- Replace the placeholder values with the real Bishop / Lead Priest details:
DO $$
DECLARE
  super_admin_id UUID := uuid_generate_v4();
  super_admin_email TEXT := 'adelgerges@church.org'; -- REPLACE WITH YOUR REAL EMAIL
  super_admin_password TEXT := 'AdelGerges'; -- MIN 12 CHARACTERS
  super_admin_name TEXT := 'Adel Gerges';
  super_admin_name_ar TEXT := 'عادل عاطف';
  encrypted_pass TEXT;
BEGIN
  -- Generate secure bcrypt password hash
  encrypted_pass := crypt(super_admin_password, gen_salt('bf'));

  -- 1. Create entry in auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = super_admin_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    )
    VALUES (
      super_admin_id,
      '00000000-0000-0000-0000-000000000000',
      super_admin_email,
      encrypted_pass,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('name', super_admin_name, 'name_ar', super_admin_name_ar, 'role', 'super_admin')::jsonb,
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
  ELSE
    SELECT id INTO super_admin_id FROM auth.users WHERE email = super_admin_email;
  END IF;

  -- 2. Upsert profile in public.profiles with super_admin role and master status
  INSERT INTO public.profiles (
    id,
    email,
    name,
    name_ar,
    role,
    status,
    qr_code,
    permissions,
    created_at,
    updated_at
  )
  VALUES (
    super_admin_id,
    super_admin_email,
    super_admin_name,
    super_admin_name_ar,
    'super_admin',
    'active',
    'servant:' || super_admin_id,
    ARRAY[
      'members.view', 'members.create', 'members.edit', 'members.delete',
      'attendance.view', 'attendance.create', 'attendance.edit', 'attendance.delete',
      'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
      'events.view', 'events.create', 'events.edit', 'events.delete',
      'lessons.view', 'lessons.create', 'lessons.edit', 'lessons.delete',
      'services.view', 'services.create', 'services.edit', 'services.delete',
      'users.view', 'users.create', 'users.edit', 'users.delete', 'users.disable',
      'analytics.view', 'reports.view', 'settings.manage', 'qr.manage'
    ],
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    status = 'active',
    updated_at = NOW();

  -- 3. Log the bootstrap action
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  )
  VALUES (
    super_admin_id,
    super_admin_name,
    'SYSTEM_BOOTSTRAP',
    'user',
    super_admin_id,
    'Initial Super Admin account provisioned securely via SQL bootstrap procedure',
    NOW()
  );

  RAISE NOTICE 'Super Admin account provisioned successfully for: %', super_admin_email;
END $$;
