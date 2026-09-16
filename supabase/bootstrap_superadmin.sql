-- ========================================================================
-- PRODUCTION SUPER ADMIN BOOTSTRAP + AUTH TRIGGER REPAIR
-- Run this script in the Supabase SQL Editor. It is fully idempotent:
--   1. Rebuilds the handle_new_user() trigger (fixes signup/login 500s
--      caused by a stale or broken deployed version)
--   2. Normalizes manually-created auth.users rows
--   3. Provisions the two Super Admin accounts (Adel + Omar)
-- WARNING: contains real credentials — do NOT commit this file with real
-- passwords. Revert the DECLARE values to placeholders after running.
-- ========================================================================

-- ------------------------------------------------------------------------
-- 1. Rebuild the profile-provisioning trigger (correct version)
-- ------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------
-- 2. Normalize existing auth.users rows (repair manually-created accounts)
-- ------------------------------------------------------------------------
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  aud = 'authenticated',
  role = 'authenticated',
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb),
  updated_at = NOW()
WHERE email IN ('adelgerges@church.org', 'omar@church.org');

-- ------------------------------------------------------------------------
-- 3. Provision Super Admin: Adel
-- ------------------------------------------------------------------------
DO $$
DECLARE
  super_admin_id UUID := gen_random_uuid();
  super_admin_email TEXT := 'adelgerges@church.org';
  super_admin_password TEXT := 'AdelGerges'; -- CHANGE AFTER FIRST LOGIN
  super_admin_name TEXT := 'Adel Gerges';
  super_admin_name_ar TEXT := 'عادل عاطف';
  encrypted_pass TEXT;
BEGIN
  encrypted_pass := crypt(super_admin_password, gen_salt('bf'));

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = super_admin_email) THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    )
    VALUES (
      super_admin_id,
      '00000000-0000-0000-0000-000000000000',
      super_admin_email,
      encrypted_pass,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('name', super_admin_name, 'name_ar', super_admin_name_ar, 'role', 'super_admin')::jsonb,
      NOW(), NOW(), 'authenticated', 'authenticated'
    );
  ELSE
    SELECT id INTO super_admin_id FROM auth.users WHERE email = super_admin_email;
    UPDATE auth.users SET encrypted_password = encrypted_pass, updated_at = NOW()
    WHERE id = super_admin_id;
  END IF;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), super_admin_id, super_admin_id::text,
    jsonb_build_object('sub', super_admin_id::text, 'email', super_admin_email),
    'email', NOW(), NOW(), NOW()
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, email, name, name_ar, role, status, qr_code, permissions, created_at, updated_at)
  VALUES (
    super_admin_id, super_admin_email, super_admin_name, super_admin_name_ar,
    'super_admin', 'active', 'servant:' || super_admin_id,
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
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin', status = 'active', updated_at = NOW();

  INSERT INTO public.audit_logs (user_id, user_name, action, entity_type, entity_id, details, created_at)
  VALUES (
    super_admin_id, super_admin_name, 'SYSTEM_BOOTSTRAP', 'user', super_admin_id,
    'Super Admin account provisioned via SQL bootstrap procedure', NOW()
  );

  RAISE NOTICE 'Super Admin provisioned: %', super_admin_email;
END $$;

-- ------------------------------------------------------------------------
-- 4. Provision Super Admin: Omar
-- ------------------------------------------------------------------------
DO $$
DECLARE
  super_admin_id UUID := gen_random_uuid();
  super_admin_email TEXT := 'omar@church.org';
  super_admin_password TEXT := 'Omar#Church2026';
  super_admin_name TEXT := 'Omar';
  super_admin_name_ar TEXT := 'عمر';
  encrypted_pass TEXT;
BEGIN
  encrypted_pass := crypt(super_admin_password, gen_salt('bf'));

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = super_admin_email) THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    )
    VALUES (
      super_admin_id,
      '00000000-0000-0000-0000-000000000000',
      super_admin_email,
      encrypted_pass,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('name', super_admin_name, 'name_ar', super_admin_name_ar, 'role', 'super_admin')::jsonb,
      NOW(), NOW(), 'authenticated', 'authenticated'
    );
  ELSE
    SELECT id INTO super_admin_id FROM auth.users WHERE email = super_admin_email;
    UPDATE auth.users SET encrypted_password = encrypted_pass, updated_at = NOW()
    WHERE id = super_admin_id;
  END IF;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), super_admin_id, super_admin_id::text,
    jsonb_build_object('sub', super_admin_id::text, 'email', super_admin_email),
    'email', NOW(), NOW(), NOW()
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, email, name, name_ar, role, status, qr_code, permissions, created_at, updated_at)
  VALUES (
    super_admin_id, super_admin_email, super_admin_name, super_admin_name_ar,
    'super_admin', 'active', 'servant:' || super_admin_id,
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
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin', status = 'active', updated_at = NOW();

  INSERT INTO public.audit_logs (user_id, user_name, action, entity_type, entity_id, details, created_at)
  VALUES (
    super_admin_id, super_admin_name, 'SYSTEM_BOOTSTRAP', 'user', super_admin_id,
    'Super Admin account provisioned via SQL bootstrap procedure', NOW()
  );

  RAISE NOTICE 'Super Admin provisioned: %', super_admin_email;
END $$;
