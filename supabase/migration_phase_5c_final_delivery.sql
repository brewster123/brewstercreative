-- ==============================================================================
-- Brewster Creative — Phase 5C: Real Final Delivery
-- Commission Deliverables Database & Private Storage Foundation
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration creates/configures:
--   1. public.commission_deliverables table with all required columns & foreign keys
--   2. Performance indexes on commission_id, uploaded_by, created_at, version
--   3. Row Level Security (RLS) on public.commission_deliverables
--   4. RLS policies:
--        - Clients can ONLY SELECT deliverables for commissions where they are the owner (auth.uid() = client_id)
--        - Admins can perform SELECT, INSERT, UPDATE, DELETE (public.is_admin())
--   5. Private Supabase Storage bucket 'final-deliverables' (public = false)
--   6. Storage policies on storage.objects:
--        - Clients can ONLY SELECT (generate signed URLs / download) objects belonging to their own commission
--        - Admins have full access (SELECT, INSERT, UPDATE, DELETE)
--        - Anonymous users have NO access
--   7. Supabase Realtime publication enablement for commission_deliverables
-- ==============================================================================

-- 1. Create commission_deliverables Table
create table if not exists public.commission_deliverables (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references public.commissions(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  file_name text not null,
  file_path text not null,
  file_type text not null default 'application/octet-stream',
  file_size bigint not null default 0,
  version integer not null default 1,
  title text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all columns exist if created earlier
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_deliverables' and column_name = 'title'
  ) then
    alter table public.commission_deliverables add column title text;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_deliverables' and column_name = 'description'
  ) then
    alter table public.commission_deliverables add column description text;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_deliverables' and column_name = 'version'
  ) then
    alter table public.commission_deliverables add column version integer not null default 1;
  end if;
end $$;

-- 2. Performance Indexes
create index if not exists idx_commission_deliverables_commission_id on public.commission_deliverables(commission_id);
create index if not exists idx_commission_deliverables_uploaded_by on public.commission_deliverables(uploaded_by);
create index if not exists idx_commission_deliverables_created_at on public.commission_deliverables(created_at desc);
create index if not exists idx_commission_deliverables_version on public.commission_deliverables(commission_id, version);

-- 3. Automatic updated_at Timestamp Trigger
create or replace function public.update_commission_deliverables_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_commission_deliverables_timestamp on public.commission_deliverables;
create trigger trigger_update_commission_deliverables_timestamp
  before update on public.commission_deliverables
  for each row
  execute function public.update_commission_deliverables_timestamp();

-- 4. Enable Row Level Security (RLS) & Grant Table Permissions
alter table public.commission_deliverables enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.commission_deliverables to authenticated;

-- 5. RLS Policies for public.commission_deliverables
drop policy if exists "Clients can view deliverables for their commissions" on public.commission_deliverables;
drop policy if exists "Admins can view all commission deliverables" on public.commission_deliverables;
drop policy if exists "Admins can insert commission deliverables" on public.commission_deliverables;
drop policy if exists "Admins can update commission deliverables" on public.commission_deliverables;
drop policy if exists "Admins can delete commission deliverables" on public.commission_deliverables;

-- Client Policy: Can view deliverables ONLY for commissions where they are the client
create policy "Clients can view deliverables for their commissions"
  on public.commission_deliverables for select
  using (
    exists (
      select 1 from public.commissions c
      where c.id = commission_deliverables.commission_id
        and c.client_id = auth.uid()
    )
  );

-- Admin Policies: Full CRUD capabilities across all commission deliverables
create policy "Admins can view all commission deliverables"
  on public.commission_deliverables for select
  using (public.is_admin());

create policy "Admins can insert commission deliverables"
  on public.commission_deliverables for insert
  with check (public.is_admin());

create policy "Admins can update commission deliverables"
  on public.commission_deliverables for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete commission deliverables"
  on public.commission_deliverables for delete
  using (public.is_admin());

-- 6. Storage Bucket Setup
-- Create private bucket 'final-deliverables' (public = false)
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'final-deliverables',
  'final-deliverables',
  false,
  104857600 -- 100 MB max per deliverable archive/file
)
on conflict (id) do update set
  public = false,
  file_size_limit = 104857600;

-- 7. Storage Policies on storage.objects
-- Clean up existing deliverable storage policies if any
drop policy if exists "Admins can view all final deliverables" on storage.objects;
drop policy if exists "Admins can upload final deliverables" on storage.objects;
drop policy if exists "Admins can update final deliverables" on storage.objects;
drop policy if exists "Admins can delete final deliverables" on storage.objects;
drop policy if exists "Clients can view final deliverables for own commissions" on storage.objects;

-- Admin Storage Policies: Full CRUD in final-deliverables bucket
create policy "Admins can view all final deliverables"
  on storage.objects for select
  using (
    bucket_id = 'final-deliverables'
    and public.is_admin()
  );

create policy "Admins can upload final deliverables"
  on storage.objects for insert
  with check (
    bucket_id = 'final-deliverables'
    and public.is_admin()
  );

create policy "Admins can update final deliverables"
  on storage.objects for update
  using (
    bucket_id = 'final-deliverables'
    and public.is_admin()
  )
  with check (
    bucket_id = 'final-deliverables'
    and public.is_admin()
  );

create policy "Admins can delete final deliverables"
  on storage.objects for delete
  using (
    bucket_id = 'final-deliverables'
    and public.is_admin()
  );

-- Client Storage Policy: Clients can only download/view deliverable objects where the top-level path
-- matches a commission belonging to them: final-deliverables/{commission_id}/{deliverable_id}/filename
create policy "Clients can view final deliverables for own commissions"
  on storage.objects for select
  using (
    bucket_id = 'final-deliverables'
    and exists (
      select 1 from public.commissions c
      where c.id::text = split_part(ltrim(name, '/'), '/', 1)
        and c.client_id = auth.uid()
    )
  );

-- 8. Enable Supabase Realtime for instant deliverable streaming
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'commission_deliverables'
  ) then
    alter publication supabase_realtime add table public.commission_deliverables;
  end if;
exception
  when others then
    raise notice 'Realtime publication setup notice: %', sqlerrm;
end $$;
