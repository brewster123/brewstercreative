-- ==============================================================================
-- Brewster Creative — Phase 5E-2: Persistent Commission Milestones Ledger
-- Append-Only Milestone Activity Log & Cross-Device Synchronization
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration creates:
--   1. public.commission_milestones table
--   2. Integrity constraints (stage_number 1..8, percentage 0..100, non-null values)
--   3. Performance indexes on commission_id and created_at
--   4. Row Level Security (RLS) enforcement
--   5. Strict SELECT policies (Clients isolated to own commissions; Admins global) and Admin-only INSERT
--   6. Immutability protection: strictly NO UPDATE or DELETE grants/policies
--   7. Supabase Realtime publication enablement for live milestone synchronization
-- ==============================================================================

-- 1. Create commission_milestones Table
create table if not exists public.commission_milestones (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references public.commissions(id) on delete cascade,
  stage text not null,
  stage_number integer not null,
  percentage integer not null,
  note text not null,
  updated_by text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Constraints (Safe and Non-Destructive)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'check_commission_milestones_stage_number'
  ) then
    alter table public.commission_milestones 
      add constraint check_commission_milestones_stage_number 
      check (stage_number >= 1 and stage_number <= 8);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'check_commission_milestones_percentage'
  ) then
    alter table public.commission_milestones 
      add constraint check_commission_milestones_percentage 
      check (percentage >= 0 and percentage <= 100);
  end if;
end $$;

-- 3. Performance Indexes
create index if not exists idx_commission_milestones_commission_id 
  on public.commission_milestones(commission_id);

create index if not exists idx_commission_milestones_created_at 
  on public.commission_milestones(commission_id, created_at asc);

-- 4. Enable Row Level Security (RLS) & Grant Table Permissions
alter table public.commission_milestones enable row level security;

-- Grant usage on public schema
grant usage on schema public to anon, authenticated;

-- Table permissions: Grant strictly SELECT and INSERT to authenticated users
-- Strictly deny/revoke UPDATE and DELETE to guarantee an immutable, append-only ledger
grant select, insert on table public.commission_milestones to authenticated;
revoke update, delete on table public.commission_milestones from authenticated, anon;
revoke all on table public.commission_milestones from anon;

-- 5. RLS Policies
drop policy if exists "Admins can view all commission milestones" on public.commission_milestones;
drop policy if exists "Clients can view milestones for own commissions" on public.commission_milestones;
drop policy if exists "Admins can insert commission milestones" on public.commission_milestones;
drop policy if exists "Clients can insert milestones for own commissions" on public.commission_milestones;
drop policy if exists "Deny updates to commission milestones" on public.commission_milestones;
drop policy if exists "Deny deletes to commission milestones" on public.commission_milestones;

-- SELECT Policies:
-- Admins can view all milestones across all commissions
create policy "Admins can view all commission milestones"
  on public.commission_milestones for select
  using (public.is_admin());

-- Clients can view milestones ONLY for commissions they own (auth.uid() = client_id)
create policy "Clients can view milestones for own commissions"
  on public.commission_milestones for select
  using (
    exists (
      select 1 from public.commissions c
      where c.id = commission_milestones.commission_id
        and c.client_id = auth.uid()
    )
  );

-- INSERT Policy:
-- Strictly Admins can insert milestone ledger records directly.
-- Clients cannot directly insert arbitrary milestone rows.
create policy "Admins can insert commission milestones"
  on public.commission_milestones for insert
  with check (public.is_admin());

-- Note on UPDATE & DELETE:
-- No UPDATE or DELETE policies are defined, and permissions are revoked above.
-- This guarantees that milestone records are permanently immutable historical entries.

-- 6. Supabase Realtime Publication
-- Safely add public.commission_milestones to supabase_realtime publication
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'commission_milestones'
    ) then
      alter publication supabase_realtime add table public.commission_milestones;
    end if;
  end if;
exception
  when others then
    raise notice 'Realtime publication setup notice: %', sqlerrm;
end $$;
