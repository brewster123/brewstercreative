-- ==============================================================================
-- Brewster Creative / DESTALION — Phase 5J: Reliable Admin Commission Notifications
-- Additive & Idempotent Migration for Operator Review
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- Fixes two RLS gaps that prevented clients from notifying studio admins:
--   1. public.get_studio_admin_ids() SECURITY DEFINER RPC allows authenticated
--      users to resolve active admin user UUIDs without exposing profile rows.
--   2. public.notify_admins_on_commission_insert() AFTER INSERT trigger on
--      public.commissions atomically persists a 'New Commission Intake' row in
--      public.notifications for every admin account, regardless of client session state.
-- ==============================================================================

-- 1. Helper RPC so authenticated clients can resolve studio admin UUIDs safely
create or replace function public.get_studio_admin_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select id from public.profiles where role = 'admin';
$$;

revoke all on function public.get_studio_admin_ids() from public;
grant execute on function public.get_studio_admin_ids() to authenticated;

-- 2. Database trigger to guarantee every new commission creates an admin notification
create or replace function public.notify_admins_on_commission_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_name text;
  v_admin record;
begin
  select coalesce(nullif(trim(name), ''), split_part(email, '@', 1), 'Client')
  into v_client_name
  from public.profiles
  where id = new.client_id;

  for v_admin in
    select id from public.profiles where role = 'admin'
  loop
    if not exists (
      select 1 from public.notifications n
      where n.user_id = v_admin.id
        and n.commission_id = new.id
        and n.title = 'New Commission Intake'
    ) then
      insert into public.notifications (
        user_id,
        title,
        message,
        type,
        is_read,
        commission_id,
        link_tab
      ) values (
        v_admin.id,
        'New Commission Intake',
        format('New commission requested: "%s" by %s.', new.title, coalesce(v_client_name, 'Client')),
        'commission_update',
        false,
        new.id,
        'commissions'
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_admins_on_commission_insert on public.commissions;
create trigger trg_notify_admins_on_commission_insert
  after insert on public.commissions
  for each row execute procedure public.notify_admins_on_commission_insert();

-- 3. Ensure Supabase Realtime publication includes notifications and commissions
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'commissions'
    ) then
      alter publication supabase_realtime add table public.commissions;
    end if;
  end if;
exception
  when others then
    raise notice 'Realtime publication notice: %', sqlerrm;
end $$;
