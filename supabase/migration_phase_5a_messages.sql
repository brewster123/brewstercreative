-- ==============================================================================
-- Brewster Creative — Phase 5A: Real Communication
-- Persistent Client ↔ Admin Commission Messaging System
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration creates:
--   1. public.messages table (and compatibility with commission_messages)
--   2. Indexes for commission_id, sender_id, and created_at
--   3. Row Level Security (RLS) on public.messages
--   4. RLS policies ensuring clients only view and insert messages on their own commissions
--   5. RLS policies granting Admins full access across all commission conversations
--   6. Realtime publication enablement for real-time messaging
-- ==============================================================================

-- 1. Create messages Table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references public.commissions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure column 'body' exists if the table was created earlier with alternative schema
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'messages' and column_name = 'body'
  ) then
    alter table public.messages add column body text not null default '';
  end if;
end $$;

-- 2. Indexes for Performance and Foreign Key Lookups
create index if not exists idx_messages_commission_id on public.messages(commission_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_created_at on public.messages(created_at asc);

-- 3. Enable Row Level Security (RLS) & Grant Table Permissions
alter table public.messages enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on table public.messages to authenticated;

-- 4. RLS Policies for public.messages
drop policy if exists "Clients can view messages for their commissions" on public.messages;
drop policy if exists "Admins can view all commission messages" on public.messages;
drop policy if exists "Clients can insert messages to their own commissions" on public.messages;
drop policy if exists "Admins can insert messages to any commission" on public.messages;

-- Client SELECT Policy: Can view messages ONLY for commissions where they are the designated client
create policy "Clients can view messages for their commissions"
  on public.messages for select
  using (
    exists (
      select 1 from public.commissions c
      where c.id = messages.commission_id
        and c.client_id = auth.uid()
    )
  );

-- Admin SELECT Policy: Full visibility across all commission conversations
create policy "Admins can view all commission messages"
  on public.messages for select
  using (public.is_admin());

-- Client INSERT Policy: Can insert messages ONLY for their own commissions with authenticated sender identity
create policy "Clients can insert messages to their own commissions"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.commissions c
      where c.id = messages.commission_id
        and c.client_id = auth.uid()
    )
  );

-- Admin INSERT Policy: Admins can send messages to any commission with verified sender identity
create policy "Admins can insert messages to any commission"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and public.is_admin()
  );

-- 5. Enable Supabase Realtime for instant message delivery
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
exception
  when others then
    raise notice 'Realtime publication setup notice: %', sqlerrm;
end $$;
