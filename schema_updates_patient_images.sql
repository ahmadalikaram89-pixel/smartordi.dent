-- ============================================================
-- Migration: Patientenbilder & Röntgenaufnahmen (Storage + Tabelle)
-- Im Supabase SQL Editor (als postgres/owner) auf dem LIVE-Projekt ausführen.
-- Idempotent — kann gefahrlos erneut ausgeführt werden.
-- ============================================================

-- 1. Metadaten-Tabelle
create table if not exists patient_images (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  category text default 'other', -- 'xray' | 'photo' | 'other'
  uploaded_by uuid references user_profiles(id),
  uploaded_at timestamptz default now()
);

alter table patient_images enable row level security;

drop policy if exists "clinic_isolation_patient_images" on patient_images;
create policy "clinic_isolation_patient_images" on patient_images
  for all using (clinic_id = auth_clinic_id() or is_super_admin())
  with check (clinic_id = auth_clinic_id() or is_super_admin());

-- 2. Privater Storage-Bucket. Dateipfad-Konvention: {clinic_id}/{patient_id}/{dateiname}
--    — die Policies unten isolieren den Zugriff anhand des ersten Pfadsegments.
insert into storage.buckets (id, name, public)
values ('patient-images', 'patient-images', false)
on conflict (id) do nothing;

drop policy if exists "patient_images_select" on storage.objects;
create policy "patient_images_select" on storage.objects
  for select using (
    bucket_id = 'patient-images'
    and (is_super_admin() or (storage.foldername(name))[1] = auth_clinic_id()::text)
  );

drop policy if exists "patient_images_insert" on storage.objects;
create policy "patient_images_insert" on storage.objects
  for insert with check (
    bucket_id = 'patient-images'
    and (is_super_admin() or (storage.foldername(name))[1] = auth_clinic_id()::text)
  );

drop policy if exists "patient_images_delete" on storage.objects;
create policy "patient_images_delete" on storage.objects
  for delete using (
    bucket_id = 'patient-images'
    and (is_super_admin() or (storage.foldername(name))[1] = auth_clinic_id()::text)
  );
