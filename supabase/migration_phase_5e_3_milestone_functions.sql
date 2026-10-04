-- ==============================================================================
-- Brewster Creative — Phase 5E-3: Secure Milestone Database Functions & Trigger
-- Atomic Milestone Recording, Strict Concurrency Locking & Role Hardening
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration provides:
--   1. Stage 1: Commission Received (AFTER INSERT Trigger on public.commissions)
--      - Records Stage 1 milestone automatically upon new commission creation
--      - Uses database created_at timestamp and trusted profile attribution
--      - Idempotent and concurrency-safe
--
--   2. Stage 6: Revision Requested (Extended public.request_commission_revision)
--      - Uses FOR UPDATE row locking
--      - Atomically increments revisions_used, updates status to 'revision'
--      - Appends Stage 6 milestone to public.commission_milestones in the same transaction
--      - Preserves existing function signature, caller authorization, and limits
--
--   3. Stage 7: Final Approval (Strict public.client_approve_commission)
--      - Requires mandatory p_proof_id (uuid)
--      - Enforces strict caller authentication and commission client ownership (no admin proxy)
--      - Employs FOR UPDATE row locking on both commission and proof records
--      - Strictly requires commission status to be 'for_review'
--      - Strictly requires proof status to be 'pending_review' and matching commission
--      - Atomically updates proof to 'approved', commission to 'final_approval',
--        and inserts Stage 7 milestone with client attribution in one transaction
--      - Idempotent retry handling without duplicate milestones
--
--   4. Companion Proof Review RPC: public.client_review_commission_proof()
--      - Validates caller authorization and updates proof review status
--
--   5. Privilege Hardening:
--      - Explicitly REVOKES all execute privileges from PUBLIC and anon
--      - GRANTS execute strictly to authenticated users
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Stage 1: Commission Received (AFTER INSERT Trigger on public.commissions)
-- ------------------------------------------------------------------------------
create or replace function public.on_commission_created_record_milestone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_name text;
begin
  -- Only execute when initial status is 'pending'
  if new.status = 'pending' then
    -- Derive actor attribution from public.profiles using client_id
    select coalesce(nullif(trim(name), ''), 'Client') into v_client_name
    from public.profiles
    where id = new.client_id;

    if v_client_name is null then
      v_client_name := 'Client';
    end if;

    -- Avoid duplicate if Stage 1 already recorded for this commission
    if not exists (
      select 1 from public.commission_milestones
      where commission_id = new.id
        and stage_number = 1
    ) then
      insert into public.commission_milestones (
        commission_id,
        stage,
        stage_number,
        percentage,
        note,
        updated_by,
        created_at
      ) values (
        new.id,
        'Commission Received',
        1,
        10,
        'Commission submitted by client. Request queued for designer review.',
        v_client_name,
        new.created_at
      );
    end if;
  end if;

  return new;
end;
$$;

-- Secure trigger function execution privileges
revoke all on function public.on_commission_created_record_milestone() from public;
revoke all on function public.on_commission_created_record_milestone() from anon;
grant execute on function public.on_commission_created_record_milestone() to authenticated;

drop trigger if exists trigger_commission_created_record_milestone on public.commissions;
create trigger trigger_commission_created_record_milestone
  after insert on public.commissions
  for each row
  execute function public.on_commission_created_record_milestone();


-- ------------------------------------------------------------------------------
-- 2. Stage 6: Revision Requested (Extended public.request_commission_revision)
-- ------------------------------------------------------------------------------
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
  v_caller_name text;
  v_revision_note text;
begin
  if p_commission_id is null then
    raise exception 'Commission ID is required';
  end if;

  -- 1. Authenticate caller
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Authentication required';
  end if;

  -- 2. Fetch and lock current commission record for update to prevent concurrent race conditions
  select * into v_comm
  from public.commissions
  where id = p_commission_id
  for update;

  if not found then
    raise exception 'Commission not found';
  end if;

  -- 3. Verify caller is the commission owner or an admin
  if v_comm.client_id != v_caller_id and not public.is_admin() then
    raise exception 'Access denied: You are not authorized to request revisions on this commission';
  end if;

  -- 4. Enforce revision allowance before incrementing
  if v_comm.revisions_used >= v_comm.revisions_allowed then
    raise exception 'Revision limit reached for this commission';
  end if;

  -- 5. Atomic conditional update to prevent race conditions
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

  -- 6. Derive trusted actor attribution from profiles
  select coalesce(nullif(trim(name), ''), 'Client') into v_caller_name
  from public.profiles
  where id = v_caller_id;

  if v_caller_name is null then
    v_caller_name := 'Client';
  end if;

  -- 7. Format revision milestone note
  if p_feedback is not null and length(trim(p_feedback)) > 0 then
    v_revision_note := 'Revision #' || v_comm.revisions_used || ' requested: ' || trim(p_feedback);
  else
    v_revision_note := 'Revision #' || v_comm.revisions_used || ' requested: Client requested composition adjustments.';
  end if;

  -- 8. Record Stage 6 milestone within the same atomic transaction
  insert into public.commission_milestones (
    commission_id,
    stage,
    stage_number,
    percentage,
    note,
    updated_by,
    created_at
  ) values (
    v_comm.id,
    'Revisions',
    6,
    80,
    v_revision_note,
    v_caller_name,
    timezone('utc'::text, now())
  );

  return v_comm;
end;
$$;

-- Privilege hardening for request_commission_revision
revoke all on function public.request_commission_revision(uuid, text) from public;
revoke all on function public.request_commission_revision(uuid, text) from anon;
grant execute on function public.request_commission_revision(uuid, text) to authenticated;


-- ------------------------------------------------------------------------------
-- 3. Stage 7: Final Approval (Strict Atomic public.client_approve_commission)
-- ------------------------------------------------------------------------------
create or replace function public.client_approve_commission(
  p_commission_id uuid,
  p_proof_id uuid
)
returns public.commissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comm public.commissions;
  v_proof public.commission_proofs;
  v_caller_id uuid;
  v_caller_name text;
  v_existing_milestone_id uuid;
begin
  -- 1. Input validation: mandatory IDs
  if p_commission_id is null then
    raise exception 'Commission ID is required';
  end if;

  if p_proof_id is null then
    raise exception 'Proof ID is required for client approval';
  end if;

  -- 2. Authenticate caller
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Authentication required';
  end if;

  -- 3. Lock commission row for update to serialize concurrent actions
  select * into v_comm
  from public.commissions
  where id = p_commission_id
  for update;

  if not found then
    raise exception 'Commission not found';
  end if;

  -- 4. Verify caller is strictly the commission client owner
  -- Admins are NOT permitted to impersonate client approval
  if v_comm.client_id != v_caller_id then
    raise exception 'Access denied: Only the client who commissioned this project can approve proofs';
  end if;

  -- 5. Lock proof row for update
  select * into v_proof
  from public.commission_proofs
  where id = p_proof_id
  for update;

  if not found then
    raise exception 'Specified creative proof not found';
  end if;

  -- Verify proof strictly belongs to this commission
  if v_proof.commission_id != p_commission_id then
    raise exception 'Specified creative proof does not belong to this commission';
  end if;

  -- 6. Safe Retry / Idempotency Handling:
  -- If both commission is already final_approval AND proof is already approved,
  -- this is a safe retry of a previously completed approval transaction.
  if v_comm.status = 'final_approval' and v_proof.status = 'approved' then
    return v_comm;
  end if;

  -- 7. Validate commission lifecycle stage:
  -- Approval is strictly permitted ONLY when commission is actively in 'for_review'.
  -- Rejects 'revision', 'in_progress', 'pending', etc.
  if v_comm.status != 'for_review' then
    raise exception 'Commission must be in for_review stage to approve proof (current status: %)', v_comm.status;
  end if;

  -- 8. Validate proof status:
  -- Must be strictly 'pending_review'. Rejects proofs awaiting revision or already approved.
  if v_proof.status != 'pending_review' then
    raise exception 'Proof is not in an approvable state (current proof status: %)', v_proof.status;
  end if;

  -- 9. Atomically mark validated proof as approved
  update public.commission_proofs
  set status = 'approved',
      updated_at = timezone('utc'::text, now())
  where id = p_proof_id
  returning * into v_proof;

  -- 10. Atomically transition commission status from 'for_review' to 'final_approval'
  update public.commissions
  set status = 'final_approval',
      updated_at = timezone('utc'::text, now())
  where id = p_commission_id
  returning * into v_comm;

  -- 11. Derive trusted actor attribution from profiles for the authenticated client
  select coalesce(nullif(trim(name), ''), 'Client') into v_caller_name
  from public.profiles
  where id = v_caller_id;

  if v_caller_name is null then
    v_caller_name := 'Client';
  end if;

  -- 12. Check if a Stage 7 milestone already exists for this commission
  select id into v_existing_milestone_id
  from public.commission_milestones
  where commission_id = p_commission_id
    and stage_number = 7
  limit 1;

  if v_existing_milestone_id is null then
    insert into public.commission_milestones (
      commission_id,
      stage,
      stage_number,
      percentage,
      note,
      updated_by,
      created_at
    ) values (
      p_commission_id,
      'Final Approval',
      7,
      95,
      'Creative Proof v' || v_proof.version || ' approved by client! Preparing full production package and asset exports.',
      v_caller_name,
      timezone('utc'::text, now())
    );
  end if;

  return v_comm;
end;
$$;

-- Privilege hardening for client_approve_commission
revoke all on function public.client_approve_commission(uuid, uuid) from public;
revoke all on function public.client_approve_commission(uuid, uuid) from anon;
grant execute on function public.client_approve_commission(uuid, uuid) to authenticated;


-- ------------------------------------------------------------------------------
-- 4. Companion Proof Review RPC: public.client_review_commission_proof()
-- ------------------------------------------------------------------------------
create or replace function public.client_review_commission_proof(
  p_proof_id uuid,
  p_status text,
  p_revision_note text default null
)
returns public.commission_proofs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proof public.commission_proofs;
  v_comm public.commissions;
  v_caller_id uuid;
begin
  -- 1. Validate status input & close legacy proof approval bypass:
  -- Proof approvals must strictly execute through public.client_approve_commission()
  -- to guarantee atomic validation, status transition to 'final_approval', and Stage 7 milestone persistence.
  if p_status = 'approved' then
    raise exception 'Direct proof approval via client_review_commission_proof is blocked. Call public.client_approve_commission(p_commission_id, p_proof_id) instead to ensure atomic milestone recording and lifecycle progression.';
  end if;

  if p_status != 'revision_requested' then
    raise exception 'Invalid proof review status. Allowed value is revision_requested. For approvals, use public.client_approve_commission(p_commission_id, p_proof_id).';
  end if;

  -- 2. Authenticate caller
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Authentication required';
  end if;

  -- 3. Fetch and lock proof for update
  select * into v_proof
  from public.commission_proofs
  where id = p_proof_id
  for update;

  if not found then
    raise exception 'Creative proof not found';
  end if;

  -- 4. Fetch and lock related commission
  select * into v_comm
  from public.commissions
  where id = v_proof.commission_id
  for update;

  if not found then
    raise exception 'Associated commission not found';
  end if;

  -- 5. Verify caller ownership (client owner or admin)
  if v_comm.client_id != v_caller_id and not public.is_admin() then
    raise exception 'Access denied: You are not authorized to review this proof';
  end if;

  -- 6. If revision_requested, ensure note is provided
  if p_status = 'revision_requested' and (p_revision_note is null or length(trim(p_revision_note)) = 0) then
    raise exception 'A revision note is required when requesting revisions';
  end if;

  -- 7. Update proof status
  update public.commission_proofs
  set 
    status = p_status,
    revision_note = case when p_status = 'revision_requested' then trim(p_revision_note) else revision_note end,
    updated_at = timezone('utc'::text, now())
  where id = p_proof_id
  returning * into v_proof;

  return v_proof;
end;
$$;

-- Privilege hardening for client_review_commission_proof
revoke all on function public.client_review_commission_proof(uuid, text, text) from public;
revoke all on function public.client_review_commission_proof(uuid, text, text) from anon;
grant execute on function public.client_review_commission_proof(uuid, text, text) to authenticated;
