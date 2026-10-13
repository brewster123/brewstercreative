-- ==============================================================================
-- Brewster Creative — Phase 5D: Persistent Chat Attachments
-- Commission Messages Attachments Schema & Private Storage Foundation
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- Confirmed live table: public.commission_messages
-- Confirmed existing columns:
--   - id uuid (PK: commission_messages_pkey)
--   - commission_id uuid (FK: commission_messages_commission_id_fkey -> commissions(id) ON DELETE CASCADE)
--   - sender_id uuid (FK: commission_messages_sender_id_fkey -> profiles(id) ON DELETE CASCADE)
--   - message text
--   - created_at timestamptz
--   - updated_at timestamptz
--
-- Transaction Execution Behavior:
--   - Wrapped in an explicit BEGIN ... COMMIT block.
--   - If any precondition, check, or publication setup fails, or if an unhandled
--     error occurs, the entire transaction rolls back automatically, ensuring
--     atomic, all-or-nothing application without partial schema state.
--   - Recovery note: If partially run in an environment that disables transactions,
--     all statements are idempotent (ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
--     ON CONFLICT DO UPDATE, DROP POLICY IF EXISTS).
--
-- Safety & Non-Destructive Principles:
--   1. Fails immediately with diagnostic/remediation if public.commission_messages
--      or required core columns do not exist.
--   2. Alters existing table ONLY. No table recreation or schema reconstruction.
--   3. Does NOT touch, drop, or recreate confirmed existing constraints
--      (commission_messages_pkey, commission_messages_commission_id_fkey, commission_messages_sender_id_fkey).
--   4. Does NOT modify historical messages just to make migration pass.
--   5. Fails closed if 'commission_messages_content_required' already exists:
--      aborts with a diagnostic exception because Phase 5D has not yet been applied.
--   6. Inspects 'commission_messages_attachment_type_check' if already present:
--      aborts with existing definition if semantics cannot be proven equivalent to
--      (attachment_type IS NULL OR attachment_type IN ('image', 'file')); never drops.
--   7. Audits pre-existing check constraints safely:
--      - Unrelated constraints (no reference to 'message') are preserved.
--      - Identifies definitive text-only constraints and halts safely without auto-dropping.
--      - Halts safely on any unclassified constraint referencing 'message' so operator
--        can inspect its exact definition, avoiding assumptions based on loose keywords.
--   8. Sets up private 'chat-attachments' bucket (25 MB max limit) with reconciled,
--      safe MIME types (PNG, JPG, WebP, GIF, PDF, ZIP, TXT, MD, CSV; NO SVG).
--   9. Strictly verifies object ownership in client DELETE policy (no permissive 'owner IS NULL').
--      Clients can only delete unreferenced objects in their own commission folder when their
--      identity is positively verified as the uploader.
--  10. Realtime publication setup fails safely: checks for publication existence and
--      raises a fatal exception on failure instead of swallowing errors, guaranteeing
--      transaction rollback if realtime cannot be configured.
-- ==============================================================================

BEGIN;

-- 1. Precondition Verification: Ensure confirmed table and expected columns exist
do $$
declare
  missing_cols text := '';
begin
  if not exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'commission_messages'
  ) then
    raise exception 'Fatal migration error: Table "public.commission_messages" does not exist. Diagnostic: Migration Phase 5D requires the confirmed chat table from prior schema phases. Remediation: Ensure prior database migrations have run before applying Phase 5D. Transaction rolled back.';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_messages' and column_name = 'commission_id'
  ) then
    missing_cols := missing_cols || 'commission_id, ';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_messages' and column_name = 'sender_id'
  ) then
    missing_cols := missing_cols || 'sender_id, ';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'commission_messages' and column_name = 'message'
  ) then
    missing_cols := missing_cols || 'message, ';
  end if;

  if length(missing_cols) > 0 then
    raise exception 'Fatal migration error: Table "public.commission_messages" is missing required column(s): [%]. Diagnostic: The confirmed live schema requires columns (commission_id, sender_id, message). Remediation: Ensure core chat table columns are intact before applying Phase 5D. Transaction rolled back.', rtrim(missing_cols, ', ');
  end if;

  raise notice 'Precondition passed: confirmed table public.commission_messages and required columns are present.';
end $$;

-- 2. Add Only Attachment Metadata Columns to public.commission_messages
alter table public.commission_messages add column if not exists attachment_name text null;
alter table public.commission_messages add column if not exists attachment_path text null;
alter table public.commission_messages add column if not exists attachment_type text null;
alter table public.commission_messages add column if not exists attachment_size text null;
alter table public.commission_messages add column if not exists attachment_mime text null;

-- Add attachment_type validation constraint safely
-- Rule: attachment_type IS NULL OR attachment_type IN ('image', 'file')
-- If the constraint already exists, inspect its definition. Rather than brittle complex
-- regular expressions, verify that its normalized definition matches known canonical
-- PostgreSQL check expressions for (attachment_type IS NULL OR attachment_type IN ('image', 'file')),
-- or abort safely with the exact definition if semantic equivalence cannot be proven.
-- All existing constraints are strictly preserved; no constraint is dropped automatically.
do $$
declare
  existing_def text;
  norm_def text;
  is_verified boolean := false;
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.commission_messages'::regclass
      and conname = 'commission_messages_attachment_type_check'
  ) then
    select pg_get_constraintdef(c.oid)
    into existing_def
    from pg_constraint c
    where conrelid = 'public.commission_messages'::regclass
      and conname = 'commission_messages_attachment_type_check';

    -- Normalize whitespace and convert to lowercase for clean matching
    norm_def := lower(regexp_replace(existing_def, $re$\s+$re$, ' ', 'g'));

    -- Verify semantic equivalence against the closed, canonical PostgreSQL check constraint definitions
    -- for rule: (attachment_type IS NULL OR attachment_type IN ('image', 'file')).
    -- Any permissive or unverified definition (e.g. allowing additional types or looser conditions)
    -- is rejected to avoid accepting unauthorized attachment categories.
    if (
      norm_def = lower('CHECK (((attachment_type IS NULL) OR (attachment_type = ANY (ARRAY[''image''::text, ''file''::text]))))')
      or norm_def = lower('CHECK (((attachment_type IS NULL) OR ((attachment_type = ''image''::text) OR (attachment_type = ''file''::text))))')
      or norm_def = lower('CHECK (((attachment_type = ANY (ARRAY[''image''::text, ''file''::text])) OR (attachment_type IS NULL)))')
      or norm_def = lower('CHECK ((attachment_type IS NULL) OR (attachment_type IN (''image'', ''file'')))')
      or norm_def = lower('CHECK ((attachment_type IN (''image'', ''file'')) OR (attachment_type IS NULL))')
    ) then
      is_verified := true;
    end if;

    if is_verified then
      raise notice 'Verified existing constraint "commission_messages_attachment_type_check" has equivalent semantics: %', existing_def;
    else
      raise exception 'Fatal migration error: Constraint "commission_messages_attachment_type_check" already exists on public.commission_messages with unexpected definition: [%]. Diagnostic: Expected semantic rule is (attachment_type IS NULL OR attachment_type IN (''image'', ''file'')). The existing definition differs or cannot be proven equivalent. Remediation: Inspect the existing constraint definition manually and reconcile it before re-running Phase 5D. Existing constraint has been preserved without changes. Transaction rolled back.',
        existing_def;
    end if;
  else
    alter table public.commission_messages
      add constraint commission_messages_attachment_type_check
      check (attachment_type is null or attachment_type in ('image', 'file'));
    raise notice 'Added constraint commission_messages_attachment_type_check.';
  end if;
end $$;

-- 3. Audit for Incompatible Existing Check Constraints (Safe Audit — Fail Safely, Never Auto-Drop)
-- Confirmed existing constraints on public.commission_messages:
--   - commission_messages_pkey (PRIMARY KEY)
--   - commission_messages_commission_id_fkey (FOREIGN KEY)
--   - commission_messages_sender_id_fkey (FOREIGN KEY)
-- All existing primary key and foreign key constraints are strictly preserved.
-- If a pre-existing text-only check constraint would prevent attachment-only messages,
-- or if any constraint referencing "message" cannot be reliably proven safe, STOP the
-- migration safely with a clear diagnostic identifying the constraint name and definition.
-- Avoid claiming incompatibility or compatibility based solely on loose keywords.
do $$
declare
  r record;
  norm_def text;
  is_incompatible boolean;
begin
  for r in (
    select c.conname, pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where n.nspname = 'public'
      and c.conrelid = 'public.commission_messages'::regclass
      and c.contype = 'c'
      and c.conname not in ('commission_messages_content_required', 'commission_messages_attachment_type_check')
  ) loop
    norm_def := lower(regexp_replace(r.def, $re$\s+$re$, ' ', 'g'));

    -- Check if constraint references the "message" column
    if norm_def !~* $re$\mmessage\M$re$ then
      -- Unrelated check constraint (e.g., timestamps, status); safely preserve untouched
      raise notice 'Preserving unrelated check constraint: "%" (definition: %).', r.conname, r.def;
    else
      -- Constraint references "message". Inspect if it definitively forces text on every row:
      -- Examples of known incompatible text-only patterns:
      -- - CHECK (length(trim(message)) > 0)
      -- - CHECK (char_length(trim(both from message)) > 0)
      -- - CHECK (message IS NOT NULL)
      -- - CHECK (message <> '')
      -- while NOT permitting attachment_path.
      is_incompatible := (
        norm_def !~* $re$\mattachment_path\M$re$
        and (
          norm_def ~* $re$\m(char_length|length)\M\s*\(\s*(btrim|trim)\M\s*\(\s*(both\s+from\s+)?\(?\s*\mmessage\M(\s*::\s*text)?\s*\)?\s*\)\s*\)\s*>\s*0$re$
          or norm_def ~* $re$\m(char_length|length)\M\s*\(\s*\(?\s*\mmessage\M(\s*::\s*text)?\s*\)?\s*\)\s*>\s*0$re$
          or norm_def ~* $re$\mmessage\s+is\s+not\s+null\M$re$
          or norm_def ~* $re$\mmessage\s*(<>|!=)\s*''$re$
        )
      );

      if is_incompatible then
        raise exception 'Fatal migration error: Incompatible pre-existing text-only constraint detected: "%" on public.commission_messages with definition: [%]. Diagnostic: This constraint requires message text on every row and rejects attachment-only messages. Remediation: Review the constraint and modify it to allow attachment-only messages (e.g., message text OR attachment_path present) before re-running migration. Existing constraint preserved without changes. Transaction rolled back.',
          r.conname, r.def;
      else
        -- Cannot be reliably proven compatible or benign; stop safely for operator inspection
        raise exception 'Fatal migration error: Unclassified check constraint referencing "message" detected: "%" on public.commission_messages with definition: [%]. Diagnostic: The safety audit cannot reliably verify whether this constraint permits attachment-only messages without rejecting valid rows. Remediation: Review the constraint definition manually to confirm compatibility before re-running migration. Existing constraint preserved without changes. Transaction rolled back.',
          r.conname, r.def;
      end if;
    end if;
  end loop;

  raise notice 'Audit passed: No conflicting or unclassified check constraints detected on public.commission_messages.';
end $$;

-- 4. Fail Closed on Existing Content Constraint & Add commission_messages_content_required
-- Requirement: Non-whitespace text in "message" OR non-empty, non-whitespace "attachment_path".
-- Implemented with PostgreSQL POSIX whitespace regex: value ~ '[^[:space:]]' to reliably reject
-- strings composed solely of spaces, tabs, newlines, or carriage returns.
-- Note: attachment_name alone DOES NOT satisfy the constraint.
-- Historical rows are NEVER modified.
-- Fail-closed rule: Because this migration has not yet been applied to the live database,
-- if 'commission_messages_content_required' is already present, abort immediately with
-- a clear diagnostic rather than guessing semantic equivalence via string matching.
do $$
declare
  invalid_count integer := 0;
  total_count integer := 0;
  sample_invalid_ids text := '';
  existing_def text;
begin
  -- Fail-closed check: abort if constraint already exists
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.commission_messages'::regclass
      and conname = 'commission_messages_content_required'
  ) then
    select pg_get_constraintdef(c.oid)
    into existing_def
    from pg_constraint c
    where conrelid = 'public.commission_messages'::regclass
      and conname = 'commission_messages_content_required';

    raise exception 'Fatal migration error: Constraint "commission_messages_content_required" already exists on public.commission_messages with definition: [%]. Diagnostic: Phase 5D migration has not yet been applied to the live database; finding this named constraint indicates an unexpected existing schema state. Remediation: Inspect the existing constraint definition manually to verify if it was partially applied or pre-configured. Existing constraint preserved without changes. Transaction rolled back.',
      existing_def;
  end if;

  -- Audit historical rows against the content rule
  select count(*) into total_count from public.commission_messages;
  select count(*) into invalid_count
  from public.commission_messages
  where not (
    (message is not null and message ~ '[^[:space:]]')
    or (attachment_path is not null and attachment_path ~ '[^[:space:]]')
  );

  if invalid_count > 0 then
    select string_agg(id::text, ', ') into sample_invalid_ids
    from (
      select id from public.commission_messages
      where not (
        (message is not null and message ~ '[^[:space:]]')
        or (attachment_path is not null and attachment_path ~ '[^[:space:]]')
      )
      limit 10
    ) sub;
    raise warning 'Audit report: % total rows, % invalid row(s) found violating content requirement. Sample IDs: [%]. Historical rows are left unchanged.',
      total_count, invalid_count, sample_invalid_ids;
  else
    raise notice 'Audit report: All % row(s) in public.commission_messages satisfy the content requirement.', total_count;
  end if;

  -- Add constraint as NOT VALID to ensure zero disruption or failure on existing records
  alter table public.commission_messages
    add constraint commission_messages_content_required
    check (
      (message is not null and message ~ '[^[:space:]]')
      or (attachment_path is not null and attachment_path ~ '[^[:space:]]')
    ) not valid;
  raise notice 'Added constraint commission_messages_content_required as NOT VALID.';

  if invalid_count = 0 then
    alter table public.commission_messages
      validate constraint commission_messages_content_required;
    raise notice 'All rows valid: commission_messages_content_required validated.';
  else
    raise warning 'commission_messages_content_required remains NOT VALID to protect % historical row(s). To validate later, resolve invalid rows and run: ALTER TABLE public.commission_messages VALIDATE CONSTRAINT commission_messages_content_required;', invalid_count;
  end if;
end $$;

-- 5. Performance Index for Attachments
create index if not exists idx_commission_messages_attachment_path
  on public.commission_messages(attachment_path)
  where attachment_path is not null;

-- 6. Preserve Existing Message Table RLS Policies
-- Row level security is confirmed enabled; existing client/admin policies remain untouched.
alter table public.commission_messages enable row level security;

-- 7. Private Storage Bucket Setup: 'chat-attachments' (25 MB max limit, Reconciled MIME List)
-- Allowed MIME list matches the application's client-side picker and upload validation helper:
--   - Images: image/jpeg, image/jpg, image/png, image/webp, image/gif
--   - Documents & Archives: application/pdf, application/zip, application/x-zip-compressed, text/plain, text/markdown, text/csv
--   - SVG (image/svg+xml) is strictly excluded to prevent script execution vulnerabilities.
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
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'text/markdown',
    'text/csv'
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
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'text/markdown',
    'text/csv'
  ];

-- 8. Storage Policies on storage.objects for bucket 'chat-attachments'
-- Drop only policies specifically scoped to the chat-attachments bucket to remain idempotent
drop policy if exists "Admins can view all chat attachments" on storage.objects;
drop policy if exists "Admins can upload chat attachments" on storage.objects;
drop policy if exists "Admins can update chat attachments" on storage.objects;
drop policy if exists "Admins can delete chat attachments" on storage.objects;
drop policy if exists "Clients can view chat attachments for own commissions" on storage.objects;
drop policy if exists "Clients can upload chat attachments to own commissions" on storage.objects;
drop policy if exists "Clients can delete unreferenced chat attachments in own commission folder" on storage.objects;

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

-- Client Storage DELETE Policy (Failed-Upload Cleanup Rollback):
-- Strictly permits clients to delete an object ONLY IF:
--   1. It resides in the chat-attachments bucket.
--   2. The caller is authenticated (auth.uid() IS NOT NULL).
--   3. The caller's identity is positively verified as the object owner
--      via storage.objects.owner (UUID) or storage.objects.owner_id (text).
--      PERMISSIVE 'owner IS NULL' IS COMPLETELY DISALLOWED.
--   4. The top-level folder matches a commission owned by them (c.client_id = auth.uid()).
--   5. The object is NOT referenced by any persisted message row in public.commission_messages.
-- This enables reliable rollback cleanup when database insertion fails, while completely preventing
-- deletion of attachments for already delivered messages or any other client's files.
do $$
declare
  has_owner boolean;
  has_owner_id boolean;
  owner_clause text;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'storage' and table_name = 'objects' and column_name = 'owner'
  ) into has_owner;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'storage' and table_name = 'objects' and column_name = 'owner_id'
  ) into has_owner_id;

  if has_owner and has_owner_id then
    owner_clause := '((storage.objects.owner is not null and storage.objects.owner::text = auth.uid()::text) or (storage.objects.owner_id is not null and storage.objects.owner_id = auth.uid()::text))';
  elsif has_owner_id then
    owner_clause := '(storage.objects.owner_id is not null and storage.objects.owner_id = auth.uid()::text)';
  elsif has_owner then
    owner_clause := '(storage.objects.owner is not null and storage.objects.owner::text = auth.uid()::text)';
  else
    raise exception 'Fatal migration error: Neither owner nor owner_id column exists on storage.objects. Diagnostic: Cannot establish secure client ownership for deletion without an ownership tracking column. Remediation: Verify Supabase Storage schema configuration and ensure storage.objects includes owner or owner_id before applying Phase 5D. Transaction rolled back.';
  end if;

  execute format($pol$
    create policy "Clients can delete unreferenced chat attachments in own commission folder"
      on storage.objects for delete
      using (
        bucket_id = 'chat-attachments'
        and auth.uid() is not null
        and %s
        and exists (
          select 1 from public.commissions c
          where c.id::text = split_part(ltrim(storage.objects.name, '/'), '/', 1)
            and c.client_id = auth.uid()
        )
        and not exists (
          select 1 from public.commission_messages m
          where m.attachment_path = storage.objects.name 
             or m.attachment_path = ltrim(storage.objects.name, '/') 
             or m.attachment_path = ('chat-attachments/' || storage.objects.name)
        )
      );
  $pol$, owner_clause);

  raise notice 'Created client DELETE policy with verified positive ownership check: %', owner_clause;
end $$;

-- 9. Enable Supabase Realtime for instant message delivery
do $$
declare
  pub_exists boolean;
  tbl_in_pub boolean;
begin
  -- Verify publication exists in target environment
  select exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) into pub_exists;

  if not pub_exists then
    raise exception 'Fatal migration error: Publication "supabase_realtime" does not exist in this database. Diagnostic: Realtime message delivery cannot be configured because the publication is missing. Remediation: Verify the Supabase Realtime service is provisioned and publication "supabase_realtime" exists (or create it using "CREATE PUBLICATION supabase_realtime;"), then re-run this migration. Transaction rolled back.';
  end if;

  -- Check if public.commission_messages is already a member
  select exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'commission_messages'
  ) into tbl_in_pub;

  if tbl_in_pub then
    raise notice 'public.commission_messages is already included in publication "supabase_realtime". No changes needed.';
  else
    begin
      alter publication supabase_realtime add table public.commission_messages;
      raise notice 'Successfully added public.commission_messages to "supabase_realtime" publication.';
    exception
      when others then
        raise exception 'Fatal migration error: Failed to add public.commission_messages to publication "supabase_realtime": %. Diagnostic: The database role executing this migration may lack ownership of publication "supabase_realtime" or SUPERUSER privileges. Remediation: Grant publication ownership to the executing role, or execute "ALTER PUBLICATION supabase_realtime ADD TABLE public.commission_messages;" via the Supabase Dashboard SQL Editor as the postgres role. Transaction rolled back.', sqlerrm;
    end;
  end if;
end $$;

COMMIT;
