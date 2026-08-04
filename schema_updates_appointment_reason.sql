-- ============================================================
-- Migration: Terminsgrund (Grund des Termins)
-- Im Supabase SQL Editor (als postgres/owner) auf dem LIVE-Projekt ausführen.
-- Idempotent — kann gefahrlos erneut ausgeführt werden.
-- ============================================================

alter table appointments add column if not exists reason text;
