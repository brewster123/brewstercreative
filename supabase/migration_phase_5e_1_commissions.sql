-- ==============================================================================
-- Brewster Creative — Phase 5E-1: Persistent Commissions & Multi-Device Sync
-- Non-destructive & Idempotent Schema Alterations, Constraints, Indexes, and Realtime
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration updates public.commissions to add genuinely missing fields:
--   1. currency text not null default 'PHP'
--   2. payment_status text not null default 'Unpaid' (check: 'Unpaid', 'Partial', 'Paid')
--   3. deposit_paid boolean not null default false
--   4. total_paid boolean not null default false
--   5. revisions_allowed integer not null default 2 (check: >= 0)
--   6. revisions_used integer not null default 0 (check: >= 0)
--   7. assigned_designer text not null default 'Brewster A. Cabando'
--
-- Performance Indexes:
--   - idx_commissions_client_id on public.commissions(client_id)
--   - idx_commissions_status on public.commissions(status)
--   - idx_commissions_created_at on public.commissions(created_at desc)
--
-- Security:
--   - RLS enabled on public.commissions
--   - Admin: Full CRUD (SELECT, INSERT, UPDATE, DELETE) using public.is_admin()
--   - Authenticated Client:
--       * SELECT only their own commissions (auth.uid() = client_id)
--       * INSERT only as themselves (auth.uid() = client_id)
--       * NO arbitrary updates to admin-controlled status, payment, priority, or designer
--   - RPC for safe revision increment: public.request_commission_revision(p_commission_id)
--   - Supabase Realtime publication enabled for public.commissions
-- ==============================================================================

-- 1. Ensure Table and Missing Columns Exist
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  service_type text not null default 'Custom Graphic Design',
  description text not null,
  budget numeric not null default 0,
  deadline text default 'Flexible',
  status text not null default 'pending',
  priority text not null default 'normal',
  purpose text,
  target_audience text,
  preferred_style text,
  required_dimensions text,
  preferred_colors text[],
  reference_links text[],
  additional_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add genuine Phase 5E-1 columns if not already present
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commissions' and column_name = 'currency'
  ) then
    alter table public.commissions add column currency text not null default 'PHP';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commissions' and column_name = 'payment_status'
  ) then
    alter table public.commissions add column payment_status text not null default 'Unpaid';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commissions' and column_name = 'deposit_paid'
  ) then
    alter table public.commissions add column deposit_paid boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commissions' and column_name = 'total_paid'
  ) then
    alter table public.commissions add column total_paid boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commissions' and column_name = 'revisions_allowed'
  ) then
    alter table public.commissions add column revisions_allowed integer not null default 2;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commissions' and column_name = 'revisions_used'
  ) then
    alter table public.commissions add column revisions_used integer not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commissions' and column_name = 'assigned_designer'
  ) then
    alter table public.commissions add column assigned_designer text not null default 'Brewster A. Cabando';
  end if;
end $$;

-- 2. Constraints (Safe and Non-Destructive)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'check_commissions_payment_status'
  ) then
    alter table public.commissions 
      add constraint check_commissions_payment_status 
      check (payment_status in ('Unpaid', 'Partial', 'Paid'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'check_commissions_revisions_allowed'
  ) then
    alter table public.commissions 
      add constraint check_commissions_revisions_allowed 
      check (revisions_allowed >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'check_commissions_revisions_used'
  ) then
    alter table public.commissions 
      add constraint check_commissions_revisions_used 
      check (revisions_used >= 0);
  end if;
end $$;

-- 3. Performance Indexes
create index if not exists idx_commissions_client_id on public.commissions(client_id);
create index if not exists idx_commissions_status on public.commissions(status);
create index if not exists idx_commissions_created_at on public.commissions(created_at desc);

-- 4. Enable Row Level Security (RLS) & Grants
alter table public.commissions enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.commissions to authenticated;
-- Anonymous users intentionally do NOT get select, insert, update, or delete permissions on public.commissions
revoke all on table public.commissions from anon;

-- 5. RLS Policies
drop policy if exists "Admins can view all commissions" on public.commissions;
drop policy if exists "Clients can view own commissions" on public.commissions;
drop policy if exists "Admins can insert commissions" on public.commissions;
drop policy if exists "Clients can insert own commissions" on public.commissions;
drop policy if exists "Admins can update any commission" on public.commissions;
drop policy if exists "Admins can delete any commission" on public.commissions;

-- SELECT Policies
create policy "Admins can view all commissions"
  on public.commissions for select
  using (public.is_admin());

create policy "Clients can view own commissions"
  on public.commissions for select
  using (auth.uid() = client_id);

-- INSERT Policies
create policy "Admins can insert commissions"
  on public.commissions for insert
  with check (public.is_admin());

create policy "Clients can insert own commissions"
  on public.commissions for insert
  with check (
    auth.uid() = client_id
    and status = 'pending'
    and payment_status = 'Unpaid'
    and deposit_paid = false
    and total_paid = false
    and revisions_used = 0
  );

-- UPDATE Policies (Admins only for general columns; clients update only via secure RPC)
create policy "Admins can update any commission"
  on public.commissions for update
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE Policies (Admins only)
create policy "Admins can delete any commission"
  on public.commissions for delete
  using (public.is_admin());

-- 6. Secure Database Function for Client Revision Request
-- Atomically enforces revision limits (revisions_used < revisions_allowed),
-- increments revisions_used, and updates status to 'revision'.
create or replace function public.request_commission_revision(
  p_commission_id uuid,
  p_feedback text default null
)
returns public.commissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comm public.commissions;
  v_caller_id uuid;
begin
  -- 1. Fetch current commission record
  select * into v_comm from public.commissions where id = p_commission_id;
  if not found then
    raise exception 'Commission not found';
  end if;

  -- 2. Verify caller is the commission owner or an admin
  v_caller_id := auth.uid();
  if v_caller_id is null or (v_comm.client_id != v_caller_id and not public.is_admin()) then
    raise exception 'Access denied: You are not authorized to request revisions on this commission';
  end if;

  -- 3. Enforce revision allowance before incrementing
  if v_comm.revisions_used >= v_comm.revisions_allowed then
    raise exception 'Revision limit reached for this commission';
  end if;

  -- 4. Atomic conditional update to prevent race conditions
  update public.commissions
  set 
    status = 'revision',
    revisions_used = revisions_used + 1,
    updated_at = timezone('utc'::text, now())
  where id = p_commission_id
    and revisions_used < revisions_allowed
  returning * into v_comm;

  if not found then
    raise exception 'Revision limit reached for this commission';
  end if;

  return v_comm;
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.request_commission_revision(uuid, text) to authenticated;

-- 7. Supabase Realtime Publication
-- Safely add public.commissions to supabase_realtime publication if not already present
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'commissions'
    ) then
      alter publication supabase_realtime add table public.commissions;
    end if;
  end if;
end $$;
