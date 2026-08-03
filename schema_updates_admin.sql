-- ============================================================
-- Migration: Admin-Modul — Selbstregistrierung + Klinik-/Teamverwaltung
-- Im Supabase SQL Editor (als postgres/owner) auf dem LIVE-Projekt ausführen.
-- Idempotent (drop policy if exists) — kann gefahrlos erneut ausgeführt werden.
-- ============================================================

-- 1. E-Mail auf user_profiles denormalisieren, damit Admins sehen KÖNNEN,
--    wer eine ausstehende Registrierung ist, ohne service_role-Zugriff auf
--    auth.users zu benötigen.
alter table user_profiles add column if not exists email text;

update user_profiles up
set email = au.email
from auth.users au
where up.id = au.id and up.email is null;

-- 2. Hilfsfunktion nach dem Muster von auth_clinic_id()/is_super_admin().
create or replace function auth_role()
returns user_role
language sql stable
as $$
  select role from user_profiles where id = auth.uid()
$$;

-- 3. Bei Registrierung automatisch ein PENDING-Profil anlegen:
--    role='receptionist', clinic_id=null. SECURITY DEFINER umgeht das
--    (bewusste) Fehlen einer INSERT-Policy auf user_profiles.
--    search_path ist fixiert, um search_path-Hijacking bei
--    SECURITY DEFINER-Funktionen zu verhindern.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, role, clinic_id, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'receptionist', null, new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. clinic_owner darf unzugeordnete/wartende Nutzer SEHEN (bestehende
--    SELECT-Policy trifft für clinic_id IS NULL bei einem clinic_owner nie zu).
drop policy if exists "user_profiles_select_pending_by_owner" on user_profiles;
create policy "user_profiles_select_pending_by_owner" on user_profiles
  for select
  using (clinic_id is null and auth_role() = 'clinic_owner');

-- 5. clinic_owner/super_admin dürfen wartende Nutzer übernehmen + Team-Rollen
--    bearbeiten. Der "with check" verhindert: Zuweisung in eine ANDERE
--    Klinik, Beförderung zu super_admin, oder dass ein clinic_owner sich
--    selbst über diese Policy bearbeitet.
drop policy if exists "user_profiles_admin_update" on user_profiles;
create policy "user_profiles_admin_update" on user_profiles
  for update
  using (
    is_super_admin()
    or (auth_role() = 'clinic_owner'
        and (user_profiles.clinic_id is null or user_profiles.clinic_id = auth_clinic_id()))
  )
  with check (
    is_super_admin()
    or (auth_role() = 'clinic_owner'
        and user_profiles.clinic_id = auth_clinic_id()
        and user_profiles.role <> 'super_admin'
        and user_profiles.id <> auth.uid())
  );

-- 6. clinics: nur super_admin legt an/bearbeitet. Kein DELETE — das Löschen
--    einer Klinik würde auf Patienten/Termine/Rechnungen kaskadieren;
--    stattdessen is_active zum Archivieren nutzen (Spalte existiert bereits).
drop policy if exists "clinics_insert_super_admin" on clinics;
create policy "clinics_insert_super_admin" on clinics
  for insert with check (is_super_admin());

drop policy if exists "clinics_update_super_admin" on clinics;
create policy "clinics_update_super_admin" on clinics
  for update using (is_super_admin()) with check (is_super_admin());

-- ============================================================
-- Hinweis: Der allererste super_admin muss weiterhin manuell befördert
-- werden, nachdem er sich über /signup registriert hat:
--
--   update user_profiles set role = 'super_admin' where email = '...';
--
-- (gleiches manuelles Muster wie beim bereits angelegten Test-Zahnarzt)
-- ============================================================
