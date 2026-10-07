-- ==============================================================================
-- Brewster Creative — Phase 5G: Unique Account Portfolio Views Ledger
-- Enforces one-view-per-authenticated-account on portfolio case studies
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration creates/configures:
--   1. Table: public.portfolio_views (internal account views ledger)
--   2. Unique constraint: (project_id, user_id)
--   3. Performance indexes on project_id and user_id
--   4. Row Level Security (RLS) on public.portfolio_views
--   5. Drop legacy record_portfolio_view(text) returning integer
--   6. Recreate public.record_portfolio_view(p_project_id text) returning jsonb:
--        - Strictly enforces authenticated views via auth.uid()
--        - Ignores unauthenticated visitors without incrementing
--        - Atomically inserts (project_id, user_id) with ON CONFLICT DO NOTHING
--        - Atomically increments portfolio_projects.views_count exactly once per account
--        - Returns JSONB { "viewed": boolean, "views_count": integer, "project_id": text }
--        - Preserves existing historical views_count baseline
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: public.portfolio_views (Dedicated Unique Account Views Ledger)
-- -----------------------------------------------------------------------------
create table if not exists public.portfolio_views (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.portfolio_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_portfolio_project_user_view unique (project_id, user_id)
);

-- Performance Indexes
create index if not exists idx_portfolio_views_project_id on public.portfolio_views(project_id);
create index if not exists idx_portfolio_views_user_id on public.portfolio_views(user_id);
create index if not exists idx_portfolio_views_created_at on public.portfolio_views(created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Row Level Security (RLS) & Permissions for portfolio_views
-- Private Ledger Security Model:
--   - Direct mutations revoked from anon and authenticated.
--   - Public/anon cannot view internal viewing records or viewer user IDs.
--   - Authenticated users can view only their own view records.
--   - Administrators (public.is_admin()) have oversight access.
--   - All view recording operations flow strictly through the controlled RPC.
-- -----------------------------------------------------------------------------
alter table public.portfolio_views enable row level security;

-- Table Grants: Restrict direct table manipulation
grant usage on schema public to anon, authenticated;
revoke all on table public.portfolio_views from public, anon;
revoke all on table public.portfolio_views from authenticated;

-- Allow authenticated users to SELECT from the table (subject to RLS policies below)
grant select on table public.portfolio_views to authenticated;

-- RLS Policies
drop policy if exists "Users can view own portfolio views" on public.portfolio_views;
create policy "Users can view own portfolio views" 
  on public.portfolio_views 
  for select 
  to authenticated 
  using (
    auth.uid() = user_id 
    or (select public.is_admin())
  );

drop policy if exists "Admins can manage portfolio views" on public.portfolio_views;
create policy "Admins can manage portfolio views" 
  on public.portfolio_views 
  for all 
  to authenticated 
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- 3. Atomic SECURITY DEFINER RPC: public.record_portfolio_view
-- -----------------------------------------------------------------------------
-- Drop legacy integer-returning function if exists
drop function if exists public.record_portfolio_view(text);

create or replace function public.record_portfolio_view(
  p_project_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_current_views integer;
  v_new_views integer;
  v_inserted boolean := false;
begin
  -- 1. Validate project ID argument
  if p_project_id is null or trim(p_project_id) = '' then
    raise exception 'Project ID is required.';
  end if;

  -- 2. Verify target project exists and retrieve current baseline view count
  select views_count into v_current_views
  from public.portfolio_projects
  where id = p_project_id;

  if not found then
    raise exception 'Portfolio project "%" not found.', p_project_id;
  end if;

  v_current_views := coalesce(v_current_views, 0);

  -- 3. Resolve authenticated user identity
  v_user_id := auth.uid();

  -- 4. Unauthenticated visitors are rejected/ignored — NO views counted
  if v_user_id is null then
    return jsonb_build_object(
      'viewed', false,
      'views_count', v_current_views,
      'project_id', p_project_id,
      'reason', 'unauthenticated'
    );
  end if;

  -- 5. Atomically insert into unique account view ledger
  -- ON CONFLICT DO NOTHING guarantees concurrent idempotency
  insert into public.portfolio_views (project_id, user_id)
  values (p_project_id, v_user_id)
  on conflict (project_id, user_id) do nothing
  returning true into v_inserted;

  -- 6. If a new unique view was inserted, atomically increment views_count
  if coalesce(v_inserted, false) then
    update public.portfolio_projects
    set views_count = coalesce(views_count, 0) + 1
    where id = p_project_id
    returning views_count into v_new_views;

    return jsonb_build_object(
      'viewed', true,
      'views_count', coalesce(v_new_views, v_current_views + 1),
      'project_id', p_project_id
    );
  else
    -- Account has already viewed this project: do NOT increment
    return jsonb_build_object(
      'viewed', false,
      'views_count', v_current_views,
      'project_id', p_project_id,
      'reason', 'already_viewed'
    );
  end if;
end;
$$;

-- Function Execution Permissions
revoke all on function public.record_portfolio_view(text) from public;
grant execute on function public.record_portfolio_view(text) to anon, authenticated;
