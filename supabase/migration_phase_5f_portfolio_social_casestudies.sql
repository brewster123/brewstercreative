-- ==============================================================================
-- Brewster Creative — Phase 5F: Social Portfolio & Case Study Studio
-- Schema Extensions, Portfolio Likes Ledger, and Atomic Engagement RPCs
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration creates/configures:
--   1. Schema extensions for public.portfolio_projects:
--        - project_type ('client' | 'concept')
--        - service_id (FK to public.services, on delete set null)
--        - commission_id (FK to public.commissions, on delete set null)
--        - case_study (structured JSONB for editorial case studies)
--        - likes_count (integer default 0)
--        - views_count (integer default 0)
--   2. Table: public.portfolio_likes (internal visitor & client likes ledger)
--   3. Unique constraints preventing duplicate likes per session/user
--   4. Row Level Security (RLS) on public.portfolio_likes (private internal ledger, admin-only direct access)
--   5. Atomic SECURITY DEFINER RPC: public.toggle_portfolio_like(p_project_id, p_session_id) with row locking
--   6. Atomic SECURITY DEFINER RPC: public.record_portfolio_view(p_project_id)
--   7. Supabase Realtime publication enablement for public.portfolio_likes
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extend public.portfolio_projects with Social and Case Study Columns
-- -----------------------------------------------------------------------------
alter table public.portfolio_projects 
  add column if not exists project_type text not null default 'client',
  add column if not exists service_id text null,
  add column if not exists commission_id uuid null,
  add column if not exists case_study jsonb not null default '{}'::jsonb,
  add column if not exists likes_count integer not null default 0,
  add column if not exists views_count integer not null default 0;

-- Integrity Constraints (Safe and Non-Destructive)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'check_portfolio_project_type'
  ) then
    alter table public.portfolio_projects 
      add constraint check_portfolio_project_type 
      check (project_type in ('client', 'concept'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'check_portfolio_likes_count'
  ) then
    alter table public.portfolio_projects 
      add constraint check_portfolio_likes_count 
      check (likes_count >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'check_portfolio_views_count'
  ) then
    alter table public.portfolio_projects 
      add constraint check_portfolio_views_count 
      check (views_count >= 0);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Foreign Keys: Guaranteed relationships with explicit relation-scoped checks
-- -----------------------------------------------------------------------------
do $$
declare
  v_rec record;
begin
  -- 1. Foreign Key: service_id -> public.services(id)
  select conname, confrelid
  into v_rec
  from pg_constraint
  where conname = 'fk_portfolio_projects_service_id'
    and conrelid = 'public.portfolio_projects'::regclass;

  if found then
    if v_rec.confrelid <> 'public.services'::regclass then
      raise exception 'Constraint fk_portfolio_projects_service_id exists on public.portfolio_projects but does not reference public.services.';
    end if;
  else
    alter table public.portfolio_projects
      add constraint fk_portfolio_projects_service_id
      foreign key (service_id) references public.services(id) on delete set null;
  end if;

  -- 2. Foreign Key: commission_id -> public.commissions(id)
  select conname, confrelid
  into v_rec
  from pg_constraint
  where conname = 'fk_portfolio_projects_commission_id'
    and conrelid = 'public.portfolio_projects'::regclass;

  if found then
    if v_rec.confrelid <> 'public.commissions'::regclass then
      raise exception 'Constraint fk_portfolio_projects_commission_id exists on public.portfolio_projects but does not reference public.commissions.';
    end if;
  else
    alter table public.portfolio_projects
      add constraint fk_portfolio_projects_commission_id
      foreign key (commission_id) references public.commissions(id) on delete set null;
  end if;
end $$;

-- Performance Indexes
create index if not exists idx_portfolio_project_type on public.portfolio_projects(project_type);
create index if not exists idx_portfolio_service_id on public.portfolio_projects(service_id);
create index if not exists idx_portfolio_commission_id on public.portfolio_projects(commission_id);
create index if not exists idx_portfolio_likes_count on public.portfolio_projects(likes_count desc);
create index if not exists idx_portfolio_views_count on public.portfolio_projects(views_count desc);

-- -----------------------------------------------------------------------------
-- 2. Table: public.portfolio_likes (Visitor & Client Likes Ledger)
-- -----------------------------------------------------------------------------
create table if not exists public.portfolio_likes (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.portfolio_projects(id) on delete cascade,
  user_id uuid null references public.profiles(id) on delete cascade,
  session_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Unique index to prevent duplicate likes from the same session
create unique index if not exists idx_portfolio_likes_project_session 
  on public.portfolio_likes(project_id, session_id);

-- Unique index to prevent duplicate likes from the same registered user
create unique index if not exists idx_portfolio_likes_project_user 
  on public.portfolio_likes(project_id, user_id) 
  where user_id is not null;

create index if not exists idx_portfolio_likes_project_id 
  on public.portfolio_likes(project_id);

create index if not exists idx_portfolio_likes_user_id 
  on public.portfolio_likes(user_id) 
  where user_id is not null;

-- -----------------------------------------------------------------------------
-- 3. Row Level Security (RLS) & Permissions for portfolio_likes
-- Private Ledger Security Model:
--   - Direct SELECT, INSERT, UPDATE, DELETE revoked from anon and authenticated.
--   - No raw user_id or session_id rows are ever exposed to visitors or users.
--   - All like/unlike mutations flow strictly through public.toggle_portfolio_like.
--   - Direct table administration restricted strictly to administrators.
-- -----------------------------------------------------------------------------
alter table public.portfolio_likes enable row level security;

-- Table Grants: Deny direct public/anon access to raw records
grant usage on schema public to anon, authenticated;
revoke all on table public.portfolio_likes from public, anon;
revoke all on table public.portfolio_likes from authenticated;

-- Allow authenticated administrator role direct administrative access
grant select, insert, update, delete on table public.portfolio_likes to authenticated;

-- Drop legacy / overly-permissive policies
drop policy if exists "Public can view portfolio likes" on public.portfolio_likes;
drop policy if exists "Users can insert own portfolio likes" on public.portfolio_likes;
drop policy if exists "Users can delete own portfolio likes" on public.portfolio_likes;
drop policy if exists "Admins can manage portfolio likes" on public.portfolio_likes;

-- Strictly administrator-only direct policy
create policy "Admins can manage portfolio likes"
  on public.portfolio_likes for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. RPC: public.toggle_portfolio_like
-- Atomically toggles like/unlike with pessimistic row locking on portfolio_projects
-- -----------------------------------------------------------------------------
create or replace function public.toggle_portfolio_like(
  p_project_id text,
  p_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_user_like_id uuid;
  v_anon_like_id uuid;
  v_current_likes integer;
  v_new_likes_count integer;
  v_is_liked boolean;
  v_clean_session text;
  v_session_conflict boolean;
begin
  -- 1. Input Validation
  if p_project_id is null or trim(p_project_id) = '' then
    raise exception 'Project ID is required.';
  end if;

  v_clean_session := trim(coalesce(p_session_id, ''));
  if length(v_clean_session) < 8 or length(v_clean_session) > 128 then
    raise exception 'Invalid session ID: must be between 8 and 128 characters.';
  end if;

  -- 2. Concurrency Lock: Lock the target portfolio_projects row using SELECT ... FOR UPDATE
  -- Verifies project exists and serializes concurrent toggles for the same project
  select likes_count into v_current_likes
  from public.portfolio_projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Portfolio project "%" not found.', p_project_id;
  end if;

  -- 3. Resolve caller auth (strictly auth.uid(), never trusted from caller parameter)
  v_caller_id := auth.uid();

  -- 4. Identity & Like Resolution
  if v_caller_id is not null then
    -- Check if the authenticated user already has a like for this project
    select id into v_user_like_id
    from public.portfolio_likes
    where project_id = p_project_id
      and user_id = v_caller_id
    limit 1;

    -- Check if there is an anonymous like row for this project and session (user_id IS NULL)
    select id into v_anon_like_id
    from public.portfolio_likes
    where project_id = p_project_id
      and session_id = v_clean_session
      and user_id is null
    limit 1;

    if v_user_like_id is not null then
      if v_anon_like_id is not null then
        -- Rule: If authenticated user already has a like for that project,
        -- do NOT transfer the anonymous row or increment/decrement likes_count.
        -- Safe, consistent result: user is already in a liked state.
        v_is_liked := true;
        v_new_likes_count := v_current_likes;
      else
        -- Standard Authenticated Unlike: Toggle off
        delete from public.portfolio_likes where id = v_user_like_id;

        update public.portfolio_projects
        set likes_count = greatest(0, likes_count - 1),
            updated_at = timezone('utc'::text, now())
        where id = p_project_id
        returning likes_count into v_new_likes_count;

        v_is_liked := false;
      end if;
    else
      -- Authenticated user has NOT yet liked this project under their account.
      if v_anon_like_id is not null then
        -- Transfer pre-login anonymous like to authenticated account.
        -- Neither index is violated:
        --   (project_id, session_id) is already held by this row.
        --   (project_id, user_id) is vacant because v_user_like_id is null.
        begin
          update public.portfolio_likes
          set user_id = v_caller_id
          where id = v_anon_like_id;

          v_is_liked := true;
          v_new_likes_count := v_current_likes;
        exception
          when unique_violation then
            -- Safe fallback in case of concurrent conflict
            v_is_liked := true;
            v_new_likes_count := v_current_likes;
        end;
      else
        -- Fresh like for authenticated user.
        -- Verify that session_id is not already taken by another user's like on this project
        select exists (
          select 1 from public.portfolio_likes
          where project_id = p_project_id
            and session_id = v_clean_session
        ) into v_session_conflict;

        if v_session_conflict then
          -- session_id is already in use by another like.
          -- Do not overwrite, modify, or delete another user's like, and do not corrupt counter.
          v_is_liked := false;
          v_new_likes_count := v_current_likes;
        else
          begin
            insert into public.portfolio_likes (project_id, user_id, session_id)
            values (p_project_id, v_caller_id, v_clean_session);

            update public.portfolio_projects
            set likes_count = likes_count + 1,
                updated_at = timezone('utc'::text, now())
            where id = p_project_id
            returning likes_count into v_new_likes_count;

            v_is_liked := true;
          exception
            when unique_violation then
              v_is_liked := true;
              v_new_likes_count := v_current_likes;
          end;
        end if;
      end if;
    end if;
  else
    -- Anonymous Visitor:
    -- Match strictly by session_id where user_id IS NULL to prevent touching any authenticated account
    select id into v_anon_like_id
    from public.portfolio_likes
    where project_id = p_project_id
      and session_id = v_clean_session
      and user_id is null
    limit 1;

    if v_anon_like_id is not null then
      -- Anonymous visitor already liked -> Unlike (toggle off)
      delete from public.portfolio_likes where id = v_anon_like_id;

      update public.portfolio_projects
      set likes_count = greatest(0, likes_count - 1),
          updated_at = timezone('utc'::text, now())
      where id = p_project_id
      returning likes_count into v_new_likes_count;

      v_is_liked := false;
    else
      -- Check if session_id is already taken by an authenticated user
      select exists (
        select 1 from public.portfolio_likes
        where project_id = p_project_id
          and session_id = v_clean_session
      ) into v_session_conflict;

      if v_session_conflict then
        -- Session ID is already taken by another user's like.
        -- Do not overwrite or delete that like; do not corrupt counter.
        v_is_liked := true;
        v_new_likes_count := v_current_likes;
      else
        begin
          insert into public.portfolio_likes (project_id, user_id, session_id)
          values (p_project_id, null, v_clean_session);

          update public.portfolio_projects
          set likes_count = likes_count + 1,
              updated_at = timezone('utc'::text, now())
          where id = p_project_id
          returning likes_count into v_new_likes_count;

          v_is_liked := true;
        exception
          when unique_violation then
            v_is_liked := true;
            v_new_likes_count := v_current_likes;
        end;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'liked', v_is_liked,
    'likes_count', v_new_likes_count,
    'project_id', p_project_id
  );
end;
$$;

revoke all on function public.toggle_portfolio_like(text, text) from public;
grant execute on function public.toggle_portfolio_like(text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC: public.record_portfolio_view
-- Atomically increments views_count for an existing portfolio project
-- -----------------------------------------------------------------------------
create or replace function public.record_portfolio_view(
  p_project_id text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_views_count integer;
begin
  if p_project_id is null or trim(p_project_id) = '' then
    raise exception 'Project ID is required.';
  end if;

  update public.portfolio_projects
  set views_count = coalesce(views_count, 0) + 1
  where id = p_project_id
  returning views_count into v_new_views_count;

  if not found then
    raise exception 'Portfolio project "%" not found.', p_project_id;
  end if;

  return v_new_views_count;
end;
$$;

revoke all on function public.record_portfolio_view(text) from public;
grant execute on function public.record_portfolio_view(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. Supabase Realtime Publication
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'portfolio_likes'
    ) then
      alter publication supabase_realtime add table public.portfolio_likes;
    end if;
  end if;
exception
  when others then
    raise notice 'Realtime publication setup notice: %', sqlerrm;
end $$;
