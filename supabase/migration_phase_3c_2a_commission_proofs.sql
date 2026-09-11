-- ==============================================================================
-- Brewster Creative — Phase 3C.2-A: Database & Storage Foundation
-- Creative Proof / Draft Workflow
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration creates:
--   1. public.commission_proofs table
--   2. Indexes for commission_id, uploaded_by, and status
--   3. Row Level Security (RLS) on public.commission_proofs
--   4. RLS policies granting full management to Admins and read-only access to Clients (scoped to their own commissions)
--   5. Private Supabase Storage bucket 'commission-proofs'
--   6. Storage policies ensuring strict client isolation and admin management
-- ==============================================================================

-- 1. Create commission_proofs Table
create table if not exists public.commission_proofs (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references public.commissions(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  file_name text not null,
  file_path text not null,
  file_url text,
  file_type text,
  file_size bigint,
  version integer not null default 1,
  status text not null default 'pending_review' check (status in ('pending_review', 'revision_requested', 'approved')),
  revision_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Indexes for Performance and Foreign Key Lookups
create index if not exists idx_commission_proofs_commission_id on public.commission_proofs(commission_id);
create index if not exists idx_commission_proofs_uploaded_by on public.commission_proofs(uploaded_by);
create index if not exists idx_commission_proofs_status on public.commission_proofs(status);

-- 3. Automatic updated_at Timestamp Trigger
create or replace function public.update_commission_proofs_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_commission_proofs_timestamp on public.commission_proofs;
create trigger trigger_update_commission_proofs_timestamp
  before update on public.commission_proofs
  for each row
  execute function public.update_commission_proofs_timestamp();

-- 4. Enable Row Level Security (RLS) & Grant Table Permissions
alter table public.commission_proofs enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.commission_proofs to authenticated;

-- 5. RLS Policies for public.commission_proofs
-- Clean up existing policies if any
drop policy if exists "Clients can view proofs for their commissions" on public.commission_proofs;
drop policy if exists "Admins can view all commission proofs" on public.commission_proofs;
drop policy if exists "Admins can insert commission proofs" on public.commission_proofs;
drop policy if exists "Admins can update commission proofs" on public.commission_proofs;
drop policy if exists "Admins can delete commission proofs" on public.commission_proofs;

-- Client Policy: Can view proofs ONLY for commissions where they are the client
create policy "Clients can view proofs for their commissions"
  on public.commission_proofs for select
  using (
    exists (
      select 1 from public.commissions c
      where c.id = commission_proofs.commission_id
        and c.client_id = auth.uid()
    )
  );

-- Admin Policies: Full CRUD capabilities across all commission proofs
create policy "Admins can view all commission proofs"
  on public.commission_proofs for select
  using (public.is_admin());

create policy "Admins can insert commission proofs"
  on public.commission_proofs for insert
  with check (public.is_admin());

create policy "Admins can update commission proofs"
  on public.commission_proofs for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete commission proofs"
  on public.commission_proofs for delete
  using (public.is_admin());

-- 6. Storage Bucket Setup
-- Create private bucket 'commission-proofs' (public = false)
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'commission-proofs',
  'commission-proofs',
  false,
  52428800 -- 50 MB max per proof file
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800;

-- 7. Storage Policies on storage.objects
-- Clean up existing proof storage policies if any
drop policy if exists "Admins can view all proof objects" on storage.objects;
drop policy if exists "Admins can upload proof objects" on storage.objects;
drop policy if exists "Admins can update proof objects" on storage.objects;
drop policy if exists "Admins can delete proof objects" on storage.objects;
drop policy if exists "Clients can view proofs for own commissions" on storage.objects;

-- Admin Storage Policies: Full CRUD in commission-proofs bucket
create policy "Admins can view all proof objects"
  on storage.objects for select
  using (
    bucket_id = 'commission-proofs'
    and public.is_admin()
  );

create policy "Admins can upload proof objects"
  on storage.objects for insert
  with check (
    bucket_id = 'commission-proofs'
    and public.is_admin()
  );

create policy "Admins can update proof objects"
  on storage.objects for update
  using (
    bucket_id = 'commission-proofs'
    and public.is_admin()
  )
  with check (
    bucket_id = 'commission-proofs'
    and public.is_admin()
  );

create policy "Admins can delete proof objects"
  on storage.objects for delete
  using (
    bucket_id = 'commission-proofs'
    and public.is_admin()
  );

-- Client Storage Policy: Clients can only download/view proof objects where the top-level path
-- matches a commission belonging to them: commission-proofs/{commission_id}/{proof_id}/filename
create policy "Clients can view proofs for own commissions"
  on storage.objects for select
  using (
    bucket_id = 'commission-proofs'
    and exists (
      select 1 from public.commissions c
      where c.id::text = split_part(ltrim(name, '/'), '/', 1)
        and c.client_id = auth.uid()
    )
  );
