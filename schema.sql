-- ============================================================
-- Smart Dental (نظام إدارة عيادات الأسنان) - Database Schema
-- Multi-tenant architecture على Supabase (PostgreSQL + RLS)
-- ============================================================

-- تفعيل الإضافات المطلوبة
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================
-- 1. جدول العيادات (Tenants الأساسي)
-- ============================================================
create table clinics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  email text,
  created_at timestamptz default now(),
  is_active boolean default true
);

-- ============================================================
-- 2. جدول المستخدمين (أطباء، سكرتارية، أدمن)
-- مربوط بجدول auth.users تبع Supabase
-- ============================================================
create type user_role as enum ('super_admin', 'clinic_owner', 'dentist', 'receptionist');

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'receptionist',
  clinic_id uuid references clinics(id) on delete cascade,
  phone text,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. جدول المرضى
-- ============================================================
create table patients (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  full_name text not null,
  date_of_birth date,
  phone text,
  email text,
  address text,
  medical_history text, -- حساس: أمراض مزمنة، حساسية دوائية، إلخ
  insurance_info jsonb,
  consent_given boolean default false,
  consent_date timestamptz,
  created_at timestamptz default now(),
  created_by uuid references user_profiles(id)
);

-- ============================================================
-- 4. جدول المواعيد
-- ============================================================
create type appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

create table appointments (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  dentist_id uuid references user_profiles(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status appointment_status default 'scheduled',
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. تشارت الأسنان (Dental Chart) - حالة كل سن للمريض
-- ============================================================
create table dental_charts (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  tooth_number int not null check (tooth_number between 1 and 32), -- ترقيم عالمي (FDI ممكن نعدل لاحقاً)
  condition text, -- سليم / تسوس / محشو / مقلوع / تاج / إلخ
  notes text,
  updated_at timestamptz default now(),
  updated_by uuid references user_profiles(id),
  unique (patient_id, tooth_number) -- لازم عشان upsert بصفحة تشارت الأسنان
);

-- ============================================================
-- 6. خطط العلاج
-- ============================================================
create type treatment_status as enum ('planned', 'in_progress', 'completed', 'cancelled');

create table treatment_plans (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  dentist_id uuid references user_profiles(id),
  title text not null,
  status treatment_status default 'planned',
  created_at timestamptz default now()
);

create table treatment_items (
  id uuid primary key default uuid_generate_v4(),
  treatment_plan_id uuid not null references treatment_plans(id) on delete cascade,
  tooth_number int,
  procedure_name text not null, -- حشوة، تنظيف، خلع، تقويم...
  cost numeric(10,2),
  status treatment_status default 'planned',
  scheduled_date date,
  completed_date date
);

-- ============================================================
-- 7. الفوترة والمحاسبة
-- ============================================================
create type invoice_status as enum ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled');

create table invoices (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  invoice_number text not null,
  total_amount numeric(10,2) not null,
  status invoice_status default 'draft',
  issue_date date default current_date,
  due_date date,
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(10,2) not null,
  payment_method text, -- كاش، تحويل، بطاقة
  paid_at timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS) - العزل بين العيادات
-- ============================================================

alter table clinics enable row level security;
alter table user_profiles enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table dental_charts enable row level security;
alter table treatment_plans enable row level security;
alter table treatment_items enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;

-- دالة مساعدة: ترجع clinic_id تبع المستخدم الحالي
create or replace function auth_clinic_id()
returns uuid
language sql stable
as $$
  select clinic_id from user_profiles where id = auth.uid()
$$;

-- دالة مساعدة: هل المستخدم super_admin
create or replace function is_super_admin()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from user_profiles where id = auth.uid() and role = 'super_admin'
  )
$$;

-- Policy عامة للـ patients (نفس المبدأ ينطبق على باقي الجداول المرتبطة بـ clinic_id)
create policy "clinic_isolation_select" on patients
  for select using (clinic_id = auth_clinic_id() or is_super_admin());

create policy "clinic_isolation_insert" on patients
  for insert with check (clinic_id = auth_clinic_id() or is_super_admin());

create policy "clinic_isolation_update" on patients
  for update using (clinic_id = auth_clinic_id() or is_super_admin());

create policy "clinic_isolation_delete" on patients
  for delete using (clinic_id = auth_clinic_id() or is_super_admin());

-- نفس الـ policies لازم تتكرر على: appointments, dental_charts,
-- treatment_plans, invoices (بنفس النمط بالضبط)
-- treatment_items و payments بيتفلترو عبر join مع الجدول الأب

create policy "clinic_isolation_appointments" on appointments
  for all using (clinic_id = auth_clinic_id() or is_super_admin())
  with check (clinic_id = auth_clinic_id() or is_super_admin());

create policy "clinic_isolation_dental_charts" on dental_charts
  for all using (clinic_id = auth_clinic_id() or is_super_admin())
  with check (clinic_id = auth_clinic_id() or is_super_admin());

create policy "clinic_isolation_treatment_plans" on treatment_plans
  for all using (clinic_id = auth_clinic_id() or is_super_admin())
  with check (clinic_id = auth_clinic_id() or is_super_admin());

create policy "clinic_isolation_invoices" on invoices
  for all using (clinic_id = auth_clinic_id() or is_super_admin())
  with check (clinic_id = auth_clinic_id() or is_super_admin());

create policy "treatment_items_via_plan" on treatment_items
  for all using (
    treatment_plan_id in (select id from treatment_plans where clinic_id = auth_clinic_id())
    or is_super_admin()
  );

create policy "payments_via_invoice" on payments
  for all using (
    invoice_id in (select id from invoices where clinic_id = auth_clinic_id())
    or is_super_admin()
  );

-- user_profiles: كل مستخدم بيشوف بروفايله + بروفايلات نفس العيادة
create policy "user_profiles_self_and_clinic" on user_profiles
  for select using (id = auth.uid() or clinic_id = auth_clinic_id() or is_super_admin());

-- clinics: بس super_admin أو صاحب العيادة يشوف تفاصيلها
create policy "clinics_visibility" on clinics
  for select using (id = auth_clinic_id() or is_super_admin());
