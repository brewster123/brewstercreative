-- ==============================================================================
-- DESTALION — Phase 6 Payment Security Remediation Migration (Corrected)
-- Additive Migration: Tighten deliverable RLS, atomic RPC with row locking,
-- duplicate reference number rejection, balance sequence preconditions,
-- and strict settlement-rule validation preventing target-status bypass.
-- ==============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Preflight Prerequisites Verification
-- Verifies that all required tables, columns, and functions from prior migrations exist.
-- Fails immediately with a descriptive diagnostic if schema prerequisites are missing.
-- -----------------------------------------------------------------------------
do $$
declare
  missing_tables text := '';
  missing_cols text := '';
begin
  -- Required tables
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'commissions') then
    missing_tables := missing_tables || 'public.commissions, ';
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'commission_payment_proofs') then
    missing_tables := missing_tables || 'public.commission_payment_proofs, ';
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'commission_deliverables') then
    missing_tables := missing_tables || 'public.commission_deliverables, ';
  end if;

  if length(missing_tables) > 0 then
    raise exception 'Fatal migration error: Missing required table(s): [%]. Diagnostic: Phase 6 payment security remediation requires foundational tables from prior migrations (Phase 5C/5E/5H/5I). Remediation: Ensure prerequisite database migrations have been executed before applying Phase 6. Entire transaction rolled back.', rtrim(missing_tables, ', ');
  end if;

  -- Required columns on public.commissions
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commissions' and column_name = 'client_id') then
    missing_cols := missing_cols || 'commissions.client_id, ';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commissions' and column_name = 'budget') then
    missing_cols := missing_cols || 'commissions.budget, ';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commissions' and column_name = 'payment_status') then
    missing_cols := missing_cols || 'commissions.payment_status, ';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commissions' and column_name = 'deposit_paid') then
    missing_cols := missing_cols || 'commissions.deposit_paid, ';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commissions' and column_name = 'total_paid') then
    missing_cols := missing_cols || 'commissions.total_paid, ';
  end if;

  -- Required columns on public.commission_payment_proofs
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'commission_id') then
    missing_cols := missing_cols || 'commission_payment_proofs.commission_id, ';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'payment_type') then
    missing_cols := missing_cols || 'commission_payment_proofs.payment_type, ';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'status') then
    missing_cols := missing_cols || 'commission_payment_proofs.status, ';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'reference_number') then
    missing_cols := missing_cols || 'commission_payment_proofs.reference_number, ';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'amount') then
    missing_cols := missing_cols || 'commission_payment_proofs.amount, ';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commission_payment_proofs' and column_name = 'reviewed_by') then
    missing_cols := missing_cols || 'commission_payment_proofs.reviewed_by, ';
  end if;

  -- Required columns on public.commission_deliverables
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'commission_deliverables' and column_name = 'commission_id') then
    missing_cols := missing_cols || 'commission_deliverables.commission_id, ';
  end if;

  if length(missing_cols) > 0 then
    raise exception 'Fatal migration error: Missing required column(s): [%]. Diagnostic: Phase 6 requires specific columns on commissions and payment proofs. Remediation: Run prerequisite migrations (Phase 5E-1 and Phase 5H) before running Phase 6. Entire transaction rolled back.', rtrim(missing_cols, ', ');
  end if;

  -- Verify administrative authorization function exists
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    raise exception 'Fatal migration error: Function public.is_admin() does not exist. Diagnostic: Payment security policies rely on public.is_admin() for role enforcement. Remediation: Install admin helper functions before running Phase 6. Entire transaction rolled back.';
  end if;

  raise notice 'DESTALION Preflight Check Passed: All prerequisite tables, columns, and functions verified.';
end $$;

-- -----------------------------------------------------------------------------
-- 1. Tighten Final-Deliverables Storage Access Policy
-- Strictly require BOTH payment_status = 'Paid' AND total_paid = true for clients.
-- Explicitly preserve admin full access via public.is_admin().
-- -----------------------------------------------------------------------------

-- Drop previous looser policies on storage.objects for final-deliverables
drop policy if exists "Clients can view final deliverables for own commissions" on storage.objects;
drop policy if exists "Clients can view final deliverables for their commissions" on storage.objects;

-- Recreate strict policy requiring BOTH payment_status = 'Paid' AND total_paid = true
create policy "Clients can view final deliverables for own commissions"
  on storage.objects for select
  using (
    bucket_id = 'final-deliverables'
    and exists (
      select 1 from public.commissions c
      where c.id::text = split_part(ltrim(name, '/'), '/', 1)
        and c.client_id = auth.uid()
        and c.payment_status = 'Paid'
        and c.total_paid = true
    )
  );

-- Explicitly ensure Admin storage policy exists for final-deliverables
drop policy if exists "Admins can view all final deliverables" on storage.objects;
create policy "Admins can view all final deliverables"
  on storage.objects for select
  using (
    bucket_id = 'final-deliverables'
    and public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 2. Tighten public.commission_deliverables Table Policy
-- Strictly require BOTH payment_status = 'Paid' AND total_paid = true for clients.
-- Ensure RLS is enabled and admin policy is explicitly preserved.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'commission_deliverables'
  ) then
    execute 'alter table public.commission_deliverables enable row level security';
    
    execute 'drop policy if exists "Clients can view deliverables for their commissions" on public.commission_deliverables';
    execute 'create policy "Clients can view deliverables for their commissions"
      on public.commission_deliverables for select
      using (
        exists (
          select 1 from public.commissions c
          where c.id = commission_deliverables.commission_id
            and c.client_id = auth.uid()
            and c.payment_status = ''Paid''
            and c.total_paid = true
        )
      )';

    execute 'drop policy if exists "Admins can view all commission deliverables" on public.commission_deliverables';
    execute 'create policy "Admins can view all commission deliverables"
      on public.commission_deliverables for select
      using (public.is_admin())';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Reference Number Uniqueness & Integrity
-- Prevent duplicate GCash reference number submission across active receipts.
-- Safe pre-check: inspect existing data for duplicates before index creation.
-- Drops and recreates index to guarantee exact canonical expression and predicate.
-- -----------------------------------------------------------------------------
do $$
declare
  v_dup_count int := 0;
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'commission_payment_proofs'
  ) then
    select count(*) into v_dup_count
    from (
      select lower(regexp_replace(trim(reference_number), '[\s\-]', '', 'g')) as norm_ref
      from public.commission_payment_proofs
      where reference_number is not null 
        and trim(reference_number) != '' 
        and status in ('pending_verification', 'confirmed')
      group by lower(regexp_replace(trim(reference_number), '[\s\-]', '', 'g'))
      having count(*) > 1
    ) dups;

    if v_dup_count > 0 then
      raise exception 'Fatal migration error: % duplicate active GCash reference number(s) detected in public.commission_payment_proofs. Diagnostic: Cannot create unique index idx_payment_proofs_unique_active_ref while conflicting active receipts exist. Remediation: Resolve or reject duplicate payment receipts before applying this migration. No payment records were modified or deleted. Entire transaction rolled back.', v_dup_count;
    end if;

    execute 'drop index if exists public.idx_payment_proofs_unique_active_ref';
    execute 'create unique index idx_payment_proofs_unique_active_ref
      on public.commission_payment_proofs (
        lower(regexp_replace(trim(reference_number), ''[\s\-]'', '''', ''g''))
      )
      where reference_number is not null 
        and trim(reference_number) != '''' 
        and status in (''pending_verification'', ''confirmed'')';
    raise notice 'DESTALION Migration: Unique partial index idx_payment_proofs_unique_active_ref verified and created successfully.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Atomic Admin Payment Verification RPC with Strict Settlement Gating
-- Security & Integrity Hardening:
--   - Caller authentication: verifies public.is_admin() server-side
--   - Row locking: SELECT ... FOR UPDATE on target receipt and associated commission
--   - Idempotency guard: rejects review if status != 'pending_verification'
--   - Status validation: restricts p_target_payment_status to ('Partial', 'Paid', null)
--   - Payment type validation: restricts v_proof.payment_type to ('deposit', 'balance', 'full')
--   - Anti-Bypass Rule 1: A deposit receipt can NEVER mark a commission 'Paid' (rejects target 'Paid')
--   - Anti-Bypass Rule 2: A balance receipt REQUIRES deposit_paid = true; results in 'Paid'
--   - Anti-Bypass Rule 3: A full payment receipt covers entire project; results in 'Paid'
--   - State preservation: deposit_paid remains true and is never reset on settlement
--   - Mandatory rejection notes: enforced when p_decision = 'rejected'
--   - Single-transaction atomic updates to proof and commission records
--   - Sandboxed execution: search_path = public, pg_temp; restricted execute grants
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
set search_path = public, pg_temp
as $$
declare
  v_proof public.commission_payment_proofs;
  v_commission public.commissions;
  v_new_payment_status text;
  v_is_deposit boolean;
  v_is_total boolean;
begin
  -- 1. Authorization check: Admin only
  if not public.is_admin() then
    raise exception 'Access Denied: Only studio directors are authorized to verify payments.';
  end if;

  -- 2. Validate decision argument (reject NULL and unsupported actions)
  if p_decision is null or p_decision not in ('confirmed', 'rejected') then
    raise exception 'Invalid decision "%". Must be "confirmed" or "rejected".', coalesce(p_decision, 'NULL');
  end if;

  -- 3. Validate p_target_payment_status argument if provided
  if p_target_payment_status is not null and p_target_payment_status not in ('Partial', 'Paid') then
    raise exception 'Invalid target payment status "%". Must be "Partial", "Paid", or null.', p_target_payment_status;
  end if;

  -- 4. Acquire exclusive lock on the target payment proof row
  select * into v_proof 
  from public.commission_payment_proofs 
  where id = p_proof_id 
  for update;

  if not found then
    raise exception 'Payment proof not found with ID %', p_proof_id;
  end if;

  -- 5. Validate payment_type on the receipt row (reject NULL and unsupported types)
  if v_proof.payment_type is null or v_proof.payment_type not in ('deposit', 'balance', 'full') then
    raise exception 'Invalid payment type "%" on receipt proof ID %.', coalesce(v_proof.payment_type, 'NULL'), p_proof_id;
  end if;

  -- 6. Validate receipt amount integrity: amount must be positive
  if v_proof.amount is not null and v_proof.amount <= 0 then
    raise exception 'Payment receipt % has invalid amount (%). Amount must be greater than zero.', p_proof_id, v_proof.amount;
  end if;

  -- 7. Idempotency & Repeat Review Guard:
  -- Only receipts in 'pending_verification' status can be reviewed (reject NULL and non-pending).
  if v_proof.status is null or v_proof.status != 'pending_verification' then
    raise exception 'Payment proof % has status "%" (must be "pending_verification") and cannot be reviewed again.', p_proof_id, coalesce(v_proof.status, 'NULL');
  end if;

  -- 8. Lock the associated commission row
  select * into v_commission 
  from public.commissions 
  where id = v_proof.commission_id 
  for update;

  if not found then
    raise exception 'Associated commission not found with ID %', v_proof.commission_id;
  end if;

  -- 9. Validate receipt amount against confirmed commission budget
  if v_commission.budget is not null and v_commission.budget > 0 then
    if v_proof.amount is not null and v_proof.amount > v_commission.budget then
      raise exception 'Payment proof amount (%) exceeds total commission budget (%).', v_proof.amount, v_commission.budget;
    end if;
  end if;

  -- 10. Process Confirmation with Strict Settlement Invariant Enforcement
  if p_decision = 'confirmed' then

    -- ANTI-DOWNGRADE RULE: A commission that is already fully paid cannot be altered
    -- or downgraded to Partial by approving another receipt.
    if coalesce(v_commission.total_paid, false) = true or v_commission.payment_status = 'Paid' then
      raise exception 'Cannot approve payment receipt %: commission % is already fully paid (status: Paid, total_paid: true). Payment status cannot be downgraded.',
        p_proof_id, v_proof.commission_id;
    end if;

    if v_proof.payment_type = 'deposit' then
      -- ANTI-BYPASS RULE: A deposit receipt is a partial down-payment.
      -- It must NEVER mark a commission as fully paid (Paid) or set total_paid = true.
      if p_target_payment_status is not null and p_target_payment_status = 'Paid' then
        raise exception 'A deposit payment receipt cannot mark a commission as fully paid (Paid). Deposit receipts only establish partial deposit settlement (Partial).';
      end if;

      -- CONFLICT GUARD: A commission can only have ONE confirmed deposit.
      if coalesce(v_commission.deposit_paid, false) = true then
        raise exception 'Cannot approve deposit receipt %: an initial deposit has already been confirmed for commission %.',
          p_proof_id, v_proof.commission_id;
      end if;

      v_new_payment_status := 'Partial';
      v_is_deposit := true;
      v_is_total := false;

    elsif v_proof.payment_type = 'balance' then
      -- SEQUENCE RULE: A balance receipt requires a previously confirmed deposit.
      if not coalesce(v_commission.deposit_paid, false) then
        raise exception 'Cannot approve balance payment proof before deposit payment has been confirmed.';
      end if;

      if p_target_payment_status is not null and p_target_payment_status != 'Paid' then
        raise exception 'A balance payment receipt completes full settlement and cannot set payment status to "%". Expected "Paid".', p_target_payment_status;
      end if;

      v_new_payment_status := 'Paid';
      v_is_deposit := true;
      v_is_total := true;

    elsif v_proof.payment_type = 'full' then
      -- FULL SETTLEMENT RULE: Full payment covers 100% project investment upfront.
      -- If a deposit has already been paid, subsequent payment must be reviewed as balance.
      if coalesce(v_commission.deposit_paid, false) = true then
        raise exception 'Cannot approve full payment receipt %: an initial deposit has already been confirmed for commission %. Subsequent payments must be submitted and reviewed as balance payments.',
          p_proof_id, v_proof.commission_id;
      end if;

      if p_target_payment_status is not null and p_target_payment_status != 'Paid' then
        raise exception 'A full payment receipt covers 100%% of project investment and cannot set payment status to "%". Expected "Paid".', p_target_payment_status;
      end if;

      v_new_payment_status := 'Paid';
      v_is_deposit := true;
      v_is_total := true;
    end if;

    -- Update the payment proof record atomically
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

  -- 11. Process Rejection
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

  -- 12. Fallthrough guard: Never return unreviewed or invalid decision proofs
  else
    raise exception 'Unhandled review decision "%" for payment proof ID %.', p_decision, p_proof_id;
  end if;

  return v_proof;
end;
$$;

-- Restrict execution grants: revoke from public/anon, grant only to authenticated
revoke all on function public.admin_review_payment_proof(uuid, text, text, text) from public;
revoke all on function public.admin_review_payment_proof(uuid, text, text, text) from anon;
grant execute on function public.admin_review_payment_proof(uuid, text, text, text) to authenticated;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';

COMMIT;
