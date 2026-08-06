-- ============================================================
-- Migration: Parodontale Messwerte (Perio Charting) je Zahn
-- Im Supabase SQL Editor (als postgres/owner) auf dem LIVE-Projekt ausführen.
-- Idempotent — kann gefahrlos erneut ausgeführt werden.
--
-- Erweitert dental_charts um mesiale/mittlere/distale Messpunkte
-- (vereinfacht auf eine Fläche statt bukkal+lingual getrennt):
--   PD  = Sondierungstiefe (mm)
--   GM  = Zahnfleischrand-Position (mm, + = Rezession)
--   CAL = Klinisches Attachmentniveau (mm)
--   Blutung / Plaque / Zahnstein je Messpunkt
--   Zahnlockerung (0-3) und Furkationsbefall (0-3) je Zahn
-- ============================================================

alter table dental_charts
  add column if not exists pd_mesial int,
  add column if not exists pd_mid int,
  add column if not exists pd_distal int,
  add column if not exists gm_mesial int,
  add column if not exists gm_mid int,
  add column if not exists gm_distal int,
  add column if not exists cal_mesial int,
  add column if not exists cal_mid int,
  add column if not exists cal_distal int,
  add column if not exists bleeding_mesial boolean default false,
  add column if not exists bleeding_mid boolean default false,
  add column if not exists bleeding_distal boolean default false,
  add column if not exists plaque_mesial boolean default false,
  add column if not exists plaque_mid boolean default false,
  add column if not exists plaque_distal boolean default false,
  add column if not exists calculus_mesial boolean default false,
  add column if not exists calculus_mid boolean default false,
  add column if not exists calculus_distal boolean default false,
  add column if not exists mobility int default 0,
  add column if not exists furcation int default 0;

alter table dental_charts drop constraint if exists dental_charts_mobility_check;
alter table dental_charts add constraint dental_charts_mobility_check check (mobility between 0 and 3);

alter table dental_charts drop constraint if exists dental_charts_furcation_check;
alter table dental_charts add constraint dental_charts_furcation_check check (furcation between 0 and 3);
