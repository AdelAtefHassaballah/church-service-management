# ⛪ Khedma Hub | Enterprise Church Service Management System
### منظومة خدمة الكنيسة وإدارة الأنشطة والافتقاد والرعاية الرعوية

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)]()
[![Security Hardened](https://img.shields.io/badge/Security-RLS%20Enforced-blue.svg)]()
[![Bilingual](https://img.shields.io/badge/Languages-English%20%7C%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-indigo.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)]()
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)]()
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL%20(RLS)-3ECF8E.svg)]()

A secure, enterprise-grade, bilingual (**English + Arabic with full RTL support**) web platform designed for church leadership, priests, stage supervisors, and servants to administer church services, member rosters, attendance via QR/manual check-in, weekly lesson preparations, pastoral visitation tasks, liturgical calendars, and analytical insights.

---

## 🛡️ Production Security Architecture

* **Database-Enforced Row Level Security (RLS)**: Every table is secured at the PostgreSQL database level. Client privileges cannot be escalated by frontend tampering.
* **Server-Side Security Definer Functions**: `public.is_super_admin()`, `public.has_permission()`, and `public.user_has_service_access()` enforce strict multi-tenant and multi-service scoping.
* **Supabase Authentication**: Native email/password authentication, encrypted session handling, automatic session renewal, password reset links, and secure credential updates.
* **Privacy & PII Protection**: QR badge tokens are opaque identifiers (`MEM-XXXXXX` / `SRV-XXXXXX`) that do not expose private medical, address, or spiritual confession data in QR payloads.
* **Append-Only Audit Logging**: Comprehensive administrative logging for user creation, role modifications, service assignments, and security events.
* **Zero Hardcoded Secrets**: Zero hardcoded credentials or mock passwords in codebase. All configurations use standard environment variables.

---

## 🌟 Core Modules

### 1. 👑 Super Admin & Multi-Role Governance
* **Super Admin (System Owner)**: Master account with unconditional visibility and control across all church services, users, settings, and audit logs.
* **Admin (Priest / General Supervisor)**: Manage assigned church services, approve accounts, configure service groups, and view full analytical reports.
* **Leader (Stage / Age Group Leader)**: Manage stage roster, review weekly lesson preparations, assign pastoral visitation tasks, and track attendance.
* **Servant (Sunday School / Pastoral Servant)**: Check in members, prepare weekly lesson talks, view assigned member profiles, and complete pastoral care tasks.
* **Member**: View personal QR card badge, review service schedules, and access profile details.

### 2. 👥 Member Roster & Pastoral Care
* Comprehensive records: Full English Name, Arabic Name, Phone, WhatsApp, Service Group, Assigned Servant, Confession Father, Date of Birth, Emergency Contact, and Baptism records.
* **Role-Based Pastoral Notes**: Granular note visibility (`Servant Only`, `Leader Only`, `Admin Only`, `All Servants`).
* Multi-field real-time search and filter by group, servant, gender, or status.

### 3. 📸 High-Speed QR Badge & Attendance Engine
* **Instant QR Badge Card Generation**: Generates high-resolution printable ID cards with SVG/Canvas rendering and 1-click PNG export.
* **Camera QR Scanner**: High-speed live camera scanning with duplicate prevention, sound/confetti feedback, and offline fallback queue.
* **Manual Attendance Grid**: Batch multi-status logging (`Present`, `Absent`, `Excused`) with custom notes.

### 4. 🚨 Absent Members Tracker & 1-Click WhatsApp Outreach
* Automatically identifies consecutive absences and missing attendees for any service session.
* **1-Click WhatsApp Direct Integration**: Personalizes pastoral check-in messages in Arabic or English without exposing cloud API keys to the client.

### 5. 📖 Weekly Lesson Preparation Hub
* Weekly Sunday School lesson preparation submission module for servants.
* Submission deadline tracking with automated status classification: `Submitted (On-Time)`, `Submitted Late`, `Missing`.
* Leader feedback workflow with file attachments and 1-click WhatsApp deadline reminders.

### 6. 📋 Pastoral Visitation Tasks & Assignments
* Leaders assign tasks with priorities (`Urgent`, `High`, `Medium`, `Low`) and due dates.
* Status tracking: `Pending` → `In Progress` → `Completed`.

### 7. 📅 Liturgical Calendar & Service Schedules
* Month, week, and agenda views for Divine Liturgies, Sunday School meetings, youth fellowships, and home visitations.

### 8. 📊 Dynamic Analytics & UTF-8 CSV Reports
* Live attendance trends, group demographics, and servant lesson preparation consistency rankings.
* UTF-8 BOM CSV exports for Members, Attendance logs, and Lesson preparation rosters compatible with Microsoft Excel.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Vanilla CSS + Tailwind CSS 3.4 (Dark/Light + RTL Support) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **QR Code Engine** | QRCode.react + html5-qrcode |
| **Backend & Auth** | Supabase (PostgreSQL 15+ with Row Level Security) |
| **Storage** | Supabase Storage (`avatars`, `lesson_files`) |

---

## 🚀 Production Deployment Guide

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings** -> **API**, copy your:
   - **Project URL** (`https://<your-project-id>.supabase.co`)
   - **Anon / Public Key** (`eyJhbGciOi...`)

---

### Step 2: Initialize Database Schema & RLS Policies
1. In the Supabase Dashboard, navigate to the **SQL Editor**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) from this repository.
3. Paste the entire content and click **Run**.
4. This script automatically sets up:
   - Custom PostgreSQL types (`user_role`, `member_status`, `attendance_status`, etc.)
   - All 15+ relational tables with foreign keys and cascade constraints
   - Security Definer helper functions (`is_super_admin()`, `has_permission()`, etc.)
   - Strict Row-Level Security (RLS) policies on all tables
   - Automatic user profile provisioning trigger (`on_auth_user_created`)
   - Storage buckets (`avatars`, `lesson_files`) with secure upload policies

---

### Step 3: Bootstrap the First Super Admin Account
1. In the Supabase Dashboard SQL Editor, open [`supabase/bootstrap_superadmin.sql`](supabase/bootstrap_superadmin.sql).
2. Set your desired Super Admin email, password, and name:
   ```sql
   DO $$
   DECLARE
     admin_email TEXT := 'superadmin@yourchurch.org'; -- Replace with your real email
     admin_password TEXT := 'YourStrongSuperAdminPassword123!'; -- Replace with strong password
     admin_name TEXT := 'Super Admin';
     admin_name_ar TEXT := 'المشرف العام';
   ...
   ```
3. Click **Run**.
4. This creates the master Super Admin user in `auth.users` and assigns the `super_admin` role with unconditional master permissions in `public.profiles`.

---

### Step 4: Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:
```bash
cp .env.example .env
```
Fill in your production Supabase keys:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

---

### Step 5: Test Locally & Build Bundle
```bash
# Install dependencies
npm install

# Run local production preview server
npm run dev

# Build optimized production bundle
npm run build
```
Verify that `npm run build` exits with code 0 and generates the output directory in `dist/`.

---

### Step 6: Deploy on GitHub / Hosting Providers

#### Deploy on Vercel
1. Push your repository to your GitHub account.
2. Go to [Vercel](https://vercel.com) and click **Add New Project** -> **Import Git Repository**.
3. Select your repository.
4. Set Framework Preset to **Vite**.
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
6. Click **Deploy**.

#### Deploy on Netlify
1. Go to [Netlify](https://netlify.com) and import the repository.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Deploy site.

---

## 🔒 Security Checklist for Production

- [x] **No hardcoded credentials**: All secrets managed via environment variables.
- [x] **RLS Enabled**: RLS active and verified across all PostgreSQL tables.
- [x] **Super Admin Security**: Protected against accidental role downgrade or deletion.
- [x] **Empty Database Resilience**: Clean empty state displays for 0 members, 0 records, 0 lessons, and 0 tasks without runtime errors.
- [x] **Safe QR Payloads**: QR codes use opaque identifiers to protect member privacy.
- [x] **Password Rules**: Minimum 8 characters required on password reset and update.
- [x] **Session Persistence**: Stored securely using standard Supabase Auth token rotation.

---

## 📄 License
This project is open-source under the MIT License.
