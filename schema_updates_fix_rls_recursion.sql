-- ============================================================
-- Migration: Fix RLS infinite recursion ("stack depth limit exceeded")
-- Im Supabase SQL Editor (als postgres/owner) auf dem LIVE-Projekt ausführen.
-- Idempotent (create or replace) — kann gefahrlos erneut ausgeführt werden.
--
-- Ursache: auth_clinic_id(), is_super_admin() und auth_role() lesen aus
-- user_profiles, welches selbst per RLS geschützt ist. Ohne SECURITY DEFINER
-- lösen diese internen SELECTs die RLS-Policies (die dieselben Funktionen
-- wieder aufrufen) erneut aus -> unendliche Rekursion. SECURITY DEFINER lässt
-- die interne Abfrage RLS umgehen und durchbricht den Zyklus. Dies ist das
-- von Supabase offiziell empfohlene Muster für solche Helper-Funktionen.
-- ============================================================

create or replace function auth_clinic_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select clinic_id from user_profiles where id = auth.uid()
$$;

create or replace function is_super_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_profiles where id = auth.uid() and role = 'super_admin'
  )
$$;

create or replace function auth_role()
returns user_role
language sql stable
security definer
set search_path = public
as $$
  select role from user_profiles where id = auth.uid()
$$;
