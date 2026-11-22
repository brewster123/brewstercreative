-- ==============================================================================
-- Brewster Creative / DESTALION — Phase 5J: Reliable Admin Commission Notifications
-- Self-Contained, Additive & Idempotent Migration for Operator Review
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- What this migration guarantees:
--   1. Ensures public.notifications exists and safely adds any missing columns
--      (title, is_read, commission_id, link_tab) on older schemas.
--   2. Ensures RLS policies and grants allow clients to notify admins for their
--      own commissions and admins to read/update their notifications.
--   3. Creates public.get_studio_admin_ids() SECURITY DEFINER RPC so clients
--      can resolve active admin UUIDs safely under profiles RLS.
--   4. Creates public.notify_admins_on_commission_insert() trigger on
--      public.commissions so every new commission automatically inserts an
--      admin notification row regardless of client session state.
--   5. Enables Supabase Realtime for public.notifications and public.commissions.
-- ==============================================================================

-- 1. Ensure public.notifications table and all required columns exist
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Studio Notice',
  message text not null default '',
  type text not null default 'system',
  is_read boolean not null default false,
  commission_id uuid references public.commissions(id) on delete cascade,
  link_tab text default 'overview',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications
  add column if not exists title text not null default 'Studio Notice';

alter table public.notifications
  add column if not exists is_read boolean not null default false;

alter table public.notifications
  add column if not exists commission_id uuid references public.commissions(id) on delete cascade;

alter table public.notifications
  add column if not exists link_tab text default 'overview';

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
create index if not exists idx_notifications_commission_id on public.notifications(commission_id);

-- 2. Ensure RLS & Grants on public.notifications
alter table public.notifications enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.notifications to authenticated;

drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Admins can view all notifications" on public.notifications;
drop policy if exists "Users can update their own notification read status" on public.notifications;
drop policy if exists "Authenticated users can insert notifications for valid commission events" on public.notifications;
drop policy if exists "Admins can insert notifications" on public.notifications;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (
    auth.uid() = user_id or public.is_admin()
  );

create policy "Users can update their own notification read status"
  on public.notifications for update
  using (
    auth.uid() = user_id or public.is_admin()
  )
  with check (
    auth.uid() = user_id or public.is_admin()
  );

create policy "Authenticated users can insert notifications for valid commission events"
  on public.notifications for insert
  with check (
    auth.uid() is not null
    and (
      public.is_admin()
      or auth.uid() = user_id
      or (
        commission_id is not null and exists (
          select 1 from public.commissions c
          where c.id = notifications.commission_id
            and (c.client_id = auth.uid() or public.is_admin())
        )
      )
    )
  );

-- 3. Helper RPC so authenticated clients can resolve studio admin UUIDs safely
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

-- 4. Database trigger to guarantee every new commission creates an admin notification
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

-- 5. Ensure Supabase Realtime publication includes notifications and commissions
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
