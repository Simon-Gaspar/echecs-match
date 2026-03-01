-- ============================================================
-- DATABASE IMPROVEMENTS - Échecs Match
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Analytics: Track tournament page views
-- ============================================================
create table if not exists tournament_views (
  id uuid default uuid_generate_v4() primary key,
  tournament_id text not null,
  user_id uuid references auth.users,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tournament_views enable row level security;

-- Anyone can insert a view (even anonymous)
create policy "Anyone can insert views" on tournament_views
  for insert with check (true);

-- Anyone can count views (for the popularity badge)
create policy "Anyone can read view counts" on tournament_views
  for select using (true);

-- Index for fast counting
create index idx_tournament_views_tid on tournament_views(tournament_id);

-- 2. Default city in profiles
-- ============================================================
alter table profiles add column if not exists default_city text;
alter table profiles add column if not exists default_lat numeric;
alter table profiles add column if not exists default_lng numeric;

-- 3. Fix shortlists RLS: allow public count
-- ============================================================
-- Drop the restrictive select policy
drop policy if exists "Users can view their own shortlists." on shortlists;

-- Replace with a public select policy (needed for the "interested" counter)
create policy "Anyone can read shortlists for counts" on shortlists
  for select using (true);

-- 4. Clean up: Drop alerts table (no longer used)
-- ============================================================
-- drop table if exists alerts;
-- ^ Uncomment above if you want to fully remove. Keeping commented for safety.
