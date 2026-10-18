-- ==============================================================================
-- Brewster Creative — Phase 5H: Manual GCash Payment Verification Workflow
-- Database & Storage Foundation for Manual Payment Proofs & Deliverable Gating
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration implements:
--   1. public.commission_payment_proofs table for client receipt submissions
--   2. Performance indexes on commission_id, client_id, status, and created_at
--   3. Row Level Security (RLS) on public.commission_payment_proofs:
--        - Clients can view payment proofs for their own commissions
--        - Clients can insert payment proofs only for their own commissions with status 'pending_verification'
--        - Clients are STRICTLY FORBIDDEN from updating payment proofs or approving receipts
--        - Admins have full access (SELECT, INSERT, UPDATE, DELETE)
--   4. Dedicated private Supabase Storage bucket 'payment-proofs' (public = false)
--   5. Storage RLS policies for 'payment-proofs':
--        - Clients can upload receipt images only to their own commission folder: payment-proofs/{commission_id}/...
--        - Clients can view/download/sign receipt images only for their own commissions
--        - Admins have full access
--   6. Deliverable Security Hardening:
--        - Ensures private bucket 'final-deliverables' exists (public = false)
--        - Storage RLS: Clients can download from 'final-deliverables' ONLY when commission payment is confirmed (payment_status = 'Paid' or total_paid = true)
--        - Storage RLS: Admins have full access via public.is_admin()
--        - Safely guards public.commission_deliverables policy so it never fails with 42P01 if table does not exist
--   7. Configurable GCash columns in public.studio_profile
--   8. Supabase Realtime publication enablement for commission_payment_proofs
--   9. Atomic admin review RPC: public.admin_review_payment_proof()
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: public.commission_payment_proofs
-- -----------------------------------------------------------------------------
create table if not exists public.commission_payment_proofs (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references public.commissions(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null default 0,
  currency text not null default 'PHP',
  payment_type text not null default 'deposit' check (payment_type in ('deposit', 'full', 'balance')),
  file_path text not null,
  file_name text not null,
  file_type text not null default 'image/jpeg',
  file_size bigint not null default 0,
  reference_number text,
  client_notes text,
  status text not null default 'pending_verification' check (status in ('pending_verification', 'confirmed', 'rejected')),
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all columns exist if table was partially created
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'currency'
  ) then
    alter table public.commission_payment_proofs add column currency text not null default 'PHP';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'payment_type'
  ) then
    alter table public.commission_payment_proofs add column payment_type text not null default 'deposit' check (payment_type in ('deposit', 'full', 'balance'));
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'reference_number'
  ) then
    alter table public.commission_payment_proofs add column reference_number text;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'client_notes'
  ) then
    alter table public.commission_payment_proofs add column client_notes text;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'admin_notes'
  ) then
    alter table public.commission_payment_proofs add column admin_notes text;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'reviewed_by'
  ) then
    alter table public.commission_payment_proofs add column reviewed_by uuid references public.profiles(id);
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'reviewed_at'
  ) then
    alter table public.commission_payment_proofs add column reviewed_at timestamp with time zone;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Indexes for Performance and Foreign Key Lookups
-- -----------------------------------------------------------------------------
create index if not exists idx_payment_proofs_commission_id on public.commission_payment_proofs(commission_id);
create index if not exists idx_payment_proofs_client_id on public.commission_payment_proofs(client_id);
create index if not exists idx_payment_proofs_status on public.commission_payment_proofs(status);
create index if not exists idx_payment_proofs_created_at on public.commission_payment_proofs(created_at desc);

-- -----------------------------------------------------------------------------
-- 3. Automatic updated_at Timestamp Trigger
-- -----------------------------------------------------------------------------
create or replace function public.update_commission_payment_proofs_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_commission_payment_proofs_timestamp on public.commission_payment_proofs;
create trigger trigger_update_commission_payment_proofs_timestamp
  before update on public.commission_payment_proofs
  for each row
  execute function public.update_commission_payment_proofs_timestamp();

-- -----------------------------------------------------------------------------
-- 4. Enable Row Level Security (RLS) & Grant Table Permissions
-- -----------------------------------------------------------------------------
alter table public.commission_payment_proofs enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.commission_payment_proofs to authenticated;
revoke all on table public.commission_payment_proofs from anon;

-- -----------------------------------------------------------------------------
-- 5. RLS Policies for public.commission_payment_proofs
-- -----------------------------------------------------------------------------
drop policy if exists "Admins can view all payment proofs" on public.commission_payment_proofs;
drop policy if exists "Clients can view payment proofs for own commissions" on public.commission_payment_proofs;
drop policy if exists "Clients can insert payment proof for own commissions" on public.commission_payment_proofs;
drop policy if exists "Admins can insert payment proofs" on public.commission_payment_proofs;
drop policy if exists "Admins can update payment proofs" on public.commission_payment_proofs;
drop policy if exists "Admins can delete payment proofs" on public.commission_payment_proofs;

-- SELECT Policies:
create policy "Admins can view all payment proofs"
  on public.commission_payment_proofs for select
  using (public.is_admin());

create policy "Clients can view payment proofs for own commissions"
  on public.commission_payment_proofs for select
  using (
    auth.uid() = client_id
    or exists (
      select 1 from public.commissions c
      where c.id = commission_payment_proofs.commission_id
        and c.client_id = auth.uid()
    )
  );

-- INSERT Policies:
-- Authenticated client can submit payment proof ONLY for their own commission
-- and status must be 'pending_verification'
create policy "Clients can insert payment proof for own commissions"
  on public.commission_payment_proofs for insert
  with check (
    auth.uid() = client_id
    and status = 'pending_verification'
    and exists (
      select 1 from public.commissions c
      where c.id = commission_payment_proofs.commission_id
        and c.client_id = auth.uid()
    )
  );

create policy "Admins can insert payment proofs"
  on public.commission_payment_proofs for insert
  with check (public.is_admin());

-- UPDATE Policies:
-- Strictly Admins only! Clients CANNOT update payment proofs or alter status
create policy "Admins can update payment proofs"
  on public.commission_payment_proofs for update
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE Policies:
create policy "Admins can delete payment proofs"
  on public.commission_payment_proofs for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. Dedicated Private Storage Bucket: 'payment-proofs'
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760, -- 10 MB per receipt image
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- -----------------------------------------------------------------------------
-- 7. Storage Policies on storage.objects for 'payment-proofs'
-- -----------------------------------------------------------------------------
drop policy if exists "Admins can view all payment receipts" on storage.objects;
drop policy if exists "Admins can upload payment receipts" on storage.objects;
drop policy if exists "Admins can update payment receipts" on storage.objects;
drop policy if exists "Admins can delete payment receipts" on storage.objects;
drop policy if exists "Clients can upload payment receipt for own commissions" on storage.objects;
drop policy if exists "Clients can view payment receipts for own commissions" on storage.objects;

-- Admin Storage Policies: Full CRUD in payment-proofs
create policy "Admins can view all payment receipts"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and public.is_admin()
  );

create policy "Admins can upload payment receipts"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and public.is_admin()
  );

create policy "Admins can update payment receipts"
  on storage.objects for update
  using (
    bucket_id = 'payment-proofs'
    and public.is_admin()
  )
  with check (
    bucket_id = 'payment-proofs'
    and public.is_admin()
  );

create policy "Admins can delete payment receipts"
  on storage.objects for delete
  using (
    bucket_id = 'payment-proofs'
    and public.is_admin()
  );

-- Client Storage Policies:
-- File path convention: {commission_id}/{payment_proof_id}_{timestamp}.{ext}
create policy "Clients can upload payment receipt for own commissions"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.commissions c
      where c.id::text = split_part(ltrim(name, '/'), '/', 1)
        and c.client_id = auth.uid()
    )
  );

create policy "Clients can view payment receipts for own commissions"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.commissions c
      where c.id::text = split_part(ltrim(name, '/'), '/', 1)
        and c.client_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 8. Final Deliverables Storage Bucket & Security Gating
-- Clients can ONLY access/download final deliverables when payment is confirmed!
-- -----------------------------------------------------------------------------

-- 8a. Ensure private bucket 'final-deliverables' exists (public = false)
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

-- 8b. Storage Policies on storage.objects for 'final-deliverables'
drop policy if exists "Admins can view all final deliverables" on storage.objects;
drop policy if exists "Admins can upload final deliverables" on storage.objects;
drop policy if exists "Admins can update final deliverables" on storage.objects;
drop policy if exists "Admins can delete final deliverables" on storage.objects;
drop policy if exists "Clients can view final deliverables for own commissions" on storage.objects;

-- Admin Storage Policies: Full CRUD in 'final-deliverables'
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

-- Client Storage Policy:
-- Clients can view / download / sign deliverable files ONLY when:
-- 1. Object is in 'final-deliverables'
-- 2. First path segment matches a commission they own
-- 3. Commission payment is confirmed (payment_status = 'Paid' OR total_paid = true)
create policy "Clients can view final deliverables for own commissions"
  on storage.objects for select
  using (
    bucket_id = 'final-deliverables'
    and exists (
      select 1 from public.commissions c
      where c.id::text = split_part(ltrim(name, '/'), '/', 1)
        and c.client_id = auth.uid()
        and (c.payment_status = 'Paid' or c.total_paid = true)
    )
  );

-- 8c. Safely guarded policy for public.commission_deliverables (if table exists)
-- Does not error if the table has not been created in the database schema.
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'commission_deliverables'
  ) then
    execute 'drop policy if exists "Clients can view deliverables for their commissions" on public.commission_deliverables';
    execute 'create policy "Clients can view deliverables for their commissions"
      on public.commission_deliverables for select
      using (
        exists (
          select 1 from public.commissions c
          where c.id = commission_deliverables.commission_id
            and c.client_id = auth.uid()
            and (c.payment_status = ''Paid'' or c.total_paid = true)
        )
      )';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 9. Configurable GCash Settings in public.studio_profile
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'studio_profile') then
    if not exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' and table_name = 'studio_profile' and column_name = 'gcash_account_name'
    ) then
      alter table public.studio_profile add column gcash_account_name text default 'Brewster A. Cabando';
    end if;

    if not exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' and table_name = 'studio_profile' and column_name = 'gcash_account_number'
    ) then
      alter table public.studio_profile add column gcash_account_number text default '0917-829-4102';
    end if;

    if not exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' and table_name = 'studio_profile' and column_name = 'gcash_instructions'
    ) then
      alter table public.studio_profile add column gcash_instructions text default 'Send money via GCash Express Send. Take a screenshot of the completed transaction receipt showing the Reference No. and upload it below for studio verification.';
    end if;

    if not exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' and table_name = 'studio_profile' and column_name = 'gcash_qr_url'
    ) then
      alter table public.studio_profile add column gcash_qr_url text;
    end if;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 10. Atomic Admin Review Database Function
-- -----------------------------------------------------------------------------
create or replace function public.admin_review_payment_proof(
  p_proof_id uuid,
  p_decision text,
  p_admin_notes text default null,
  p_target_payment_status text default null
)
returns public.commission_payment_proofs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proof public.commission_payment_proofs;
  v_new_payment_status text;
  v_is_deposit boolean;
  v_is_total boolean;
begin
  -- 1. Authorization check: Admin only
  if not public.is_admin() then
    raise exception 'Access Denied: Only studio directors are authorized to verify payments.';
  end if;

  -- 2. Fetch the target payment proof record
  select * into v_proof from public.commission_payment_proofs where id = p_proof_id;
  if not found then
    raise exception 'Payment proof not found with ID %', p_proof_id;
  end if;

  -- 3. Validate decision
  if p_decision not in ('confirmed', 'rejected') then
    raise exception 'Invalid decision "%". Must be "confirmed" or "rejected".', p_decision;
  end if;

  -- 4. Process Confirmation
  if p_decision = 'confirmed' then
    v_new_payment_status := coalesce(
      p_target_payment_status,
      case 
        when v_proof.payment_type = 'full' then 'Paid'
        when v_proof.payment_type = 'balance' then 'Paid'
        else 'Partial'
      end
    );

    v_is_deposit := true;
    v_is_total := (v_new_payment_status = 'Paid');

    -- Update the payment proof
    update public.commission_payment_proofs
    set 
      status = 'confirmed',
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc'::text, now()),
      admin_notes = coalesce(p_admin_notes, admin_notes),
      updated_at = timezone('utc'::text, now())
    where id = p_proof_id
    returning * into v_proof;

    -- Atomically update the commission payment status
    update public.commissions
    set 
      payment_status = v_new_payment_status,
      deposit_paid = v_is_deposit,
      total_paid = v_is_total,
      updated_at = timezone('utc'::text, now())
    where id = v_proof.commission_id;

  -- 5. Process Rejection
  elsif p_decision = 'rejected' then
    if p_admin_notes is null or trim(p_admin_notes) = '' then
      raise exception 'Rejection reason is required when declining payment proof.';
    end if;

    update public.commission_payment_proofs
    set 
      status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc'::text, now()),
      admin_notes = trim(p_admin_notes),
      updated_at = timezone('utc'::text, now())
    where id = p_proof_id
    returning * into v_proof;
  end if;

  return v_proof;
end;
$$;

grant execute on function public.admin_review_payment_proof(uuid, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 11. Enable Supabase Realtime for instant payment proof sync
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'commission_payment_proofs'
    ) then
      alter publication supabase_realtime add table public.commission_payment_proofs;
    end if;
  end if;
exception
  when others then
    raise notice 'Realtime publication setup notice: %', sqlerrm;
end $$;
