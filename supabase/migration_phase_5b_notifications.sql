-- ==============================================================================
-- Brewster Creative — Phase 5B: Real Notifications
-- Persistent In-App Notification System
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration creates/updates:
--   1. public.notifications table with all required columns and foreign keys
--   2. Performance indexes on user_id, is_read, created_at, commission_id
--   3. Row Level Security (RLS) policies for isolated user access
--   4. RLS policies ensuring users can update only their own read status
--   5. RLS policies for event-driven notification insertion
--   6. Realtime publication enablement for instant notification badges
-- ==============================================================================

-- 1. Create notifications table if it doesn't already exist
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

-- Ensure all columns exist if the table was created earlier with a minimal schema
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'commission_id'
  ) then
    alter table public.notifications add column commission_id uuid references public.commissions(id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'link_tab'
  ) then
    alter table public.notifications add column link_tab text default 'overview';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'title'
  ) then
    alter table public.notifications add column title text not null default 'Studio Notice';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'is_read'
  ) then
    alter table public.notifications add column is_read boolean not null default false;
  end if;
end $$;

-- 2. Performance Indexes
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
create index if not exists idx_notifications_commission_id on public.notifications(commission_id);

-- 3. Enable Row Level Security (RLS) & Table Grants
alter table public.notifications enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.notifications to authenticated;

-- 4. RLS Policies
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Admins can view all notifications" on public.notifications;
drop policy if exists "Users can update their own notification read status" on public.notifications;
drop policy if exists "Authenticated users can insert notifications for valid commission events" on public.notifications;
drop policy if exists "Admins can insert notifications" on public.notifications;

-- SELECT Policy: Users see only their own notifications; Admins can see all or their own
create policy "Users can view their own notifications"
  on public.notifications for select
  using (
    auth.uid() = user_id or public.is_admin()
  );

-- UPDATE Policy: Users can only mark their own notifications as read
create policy "Users can update their own notification read status"
  on public.notifications for update
  using (
    auth.uid() = user_id or public.is_admin()
  )
  with check (
    auth.uid() = user_id or public.is_admin()
  );

-- INSERT Policy: Authenticated users can insert notifications for events they are part of
create policy "Authenticated users can insert notifications for valid commission events"
  on public.notifications for insert
  with check (
    auth.uid() is not null
    and (
      -- Admins can insert notifications for anyone
      public.is_admin()
      -- Self-notifications
      or auth.uid() = user_id
      -- Notifications tied to commissions the user participates in
      or (
        commission_id is not null and exists (
          select 1 from public.commissions c
          where c.id = notifications.commission_id
            and (c.client_id = auth.uid() or public.is_admin())
        )
      )
    )
  );

-- 5. Enable Supabase Realtime for instant notification streaming
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception
  when others then
    raise notice 'Realtime publication setup notice: %', sqlerrm;
end $$;
