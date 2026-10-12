-- ==============================================================================
-- Brewster Creative — Phase 5D: Persistent Chat Attachments
-- Message Attachments Database Schema & Private Storage Foundation
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration creates/configures:
--   1. Nullable columns in public.messages for attachment metadata:
--        - attachment_name text
--        - attachment_path text
--        - attachment_type text
--        - attachment_size text
--        - attachment_mime text
--   2. Performance index on messages(attachment_path) where attachment_path is not null
--   3. Private Supabase Storage bucket 'chat-attachments' (public = false, 25MB file limit)
--   4. Storage RLS policies on storage.objects for 'chat-attachments':
--        - Clients can ONLY SELECT (generate signed URLs / download) objects belonging to their own commission
--        - Clients can ONLY INSERT (upload) objects into their own commission folder: {commission_id}/...
--        - Admins have full access (SELECT, INSERT, UPDATE, DELETE) across all commissions
--        - Anonymous users have NO access
-- ==============================================================================

-- 1. Add attachment columns to public.messages
alter table public.messages add column if not exists attachment_name text null;
alter table public.messages add column if not exists attachment_path text null;
alter table public.messages add column if not exists attachment_type text null;
alter table public.messages add column if not exists attachment_size text null;
alter table public.messages add column if not exists attachment_mime text null;

-- Compatibility: also check commission_messages if it exists as fallback
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'commission_messages'
  ) then
    alter table public.commission_messages add column if not exists attachment_name text null;
    alter table public.commission_messages add column if not exists attachment_path text null;
    alter table public.commission_messages add column if not exists attachment_type text null;
    alter table public.commission_messages add column if not exists attachment_size text null;
    alter table public.commission_messages add column if not exists attachment_mime text null;
  end if;
end $$;

-- 2. Performance Index for attachments lookup
create index if not exists idx_messages_attachment_path
  on public.messages(attachment_path)
  where attachment_path is not null;

-- 3. Storage Bucket Setup
-- Create private bucket 'chat-attachments' (public = false) with 25MB size limit
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  26214400, -- 25 MB max per attachment
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.rar',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain',
    'text/markdown',
    'text/csv',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.rar',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain',
    'text/markdown',
    'text/csv',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav'
  ];

-- 4. Storage Policies on storage.objects for bucket 'chat-attachments'
drop policy if exists "Admins can view all chat attachments" on storage.objects;
drop policy if exists "Admins can upload chat attachments" on storage.objects;
drop policy if exists "Admins can update chat attachments" on storage.objects;
drop policy if exists "Admins can delete chat attachments" on storage.objects;
drop policy if exists "Clients can view chat attachments for own commissions" on storage.objects;
drop policy if exists "Clients can upload chat attachments to own commissions" on storage.objects;

-- Admin Storage Policies: Full CRUD in chat-attachments bucket
create policy "Admins can view all chat attachments"
  on storage.objects for select
  using (
    bucket_id = 'chat-attachments'
    and public.is_admin()
  );

create policy "Admins can upload chat attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and public.is_admin()
  );

create policy "Admins can update chat attachments"
  on storage.objects for update
  using (
    bucket_id = 'chat-attachments'
    and public.is_admin()
  )
  with check (
    bucket_id = 'chat-attachments'
    and public.is_admin()
  );

create policy "Admins can delete chat attachments"
  on storage.objects for delete
  using (
    bucket_id = 'chat-attachments'
    and public.is_admin()
  );

-- Client Storage SELECT Policy: Can only download/view attachment objects where the top-level folder
-- matches a commission belonging to them: chat-attachments/{commission_id}/...
create policy "Clients can view chat attachments for own commissions"
  on storage.objects for select
  using (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.commissions c
      where c.id::text = split_part(ltrim(name, '/'), '/', 1)
        and c.client_id = auth.uid()
    )
  );

-- Client Storage INSERT Policy: Can only upload attachments into the folder corresponding to their own commission
create policy "Clients can upload chat attachments to own commissions"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.commissions c
      where c.id::text = split_part(ltrim(name, '/'), '/', 1)
        and c.client_id = auth.uid()
    )
  );
