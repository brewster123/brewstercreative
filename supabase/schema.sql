-- ==============================================================================
-- Brewster Creative — Phase 1: Profiles & Role-Based Access Control
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- FIX FOR EXISTING DATABASES WITH INFINITE RECURSION ERROR 42P17:
-- If you already created profiles and are seeing:
--   "infinite recursion detected in policy for relation 'profiles'"
-- Run this quick fix in the Supabase SQL Editor:
--
--   CREATE OR REPLACE FUNCTION public.is_admin()
--   RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
--   BEGIN
--     RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
--   END;
--   $$;
--
--   DROP POLICY IF EXISTS "Users can view profile" ON public.profiles;
--   DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
--   DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
--
--   CREATE POLICY "Users can view own profile"
--     ON public.profiles FOR SELECT USING (auth.uid() = id);
--
--   CREATE POLICY "Admins can view all profiles"
--     ON public.profiles FOR SELECT USING (public.is_admin());
--
-- FIX FOR PERMISSION DENIED ERROR 42501:
-- If you see "permission denied for table profiles" (code 42501):
-- Run this quick grant in your Supabase SQL Editor:
--
--   GRANT USAGE ON SCHEMA public TO anon, authenticated;
--   GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
--   GRANT SELECT ON public.profiles TO anon;
-- ==============================================================================

-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  role text not null default 'client' check (role in ('client', 'admin')),
  avatar text default 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  handle text,
  contact_method text default 'Platform Chat & Email',
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS) & Grant Table Permissions
alter table public.profiles enable row level security;

-- Ensure the authenticated and anon roles have table-level permissions
grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select on table public.profiles to anon;

-- Helper security definer function to avoid infinite recursion when checking admin status
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 3. RLS Policies
-- Drop existing recursive policies if present
drop policy if exists "Users can view profile" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

-- Users can always view their own profile directly by id
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can view all profiles (uses security definer function to prevent infinite recursion)
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Users can insert their own profile row, but the role defaults strictly to 'client'
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and (role = 'client' or role is null)
  );

-- Users can update their own profile fields (name, handle, contact_method, bio, avatar)
create policy "Users can update own profile details"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. Trigger to strictly PREVENT users from escalating or altering their role via client API
create or replace function public.prevent_role_update()
returns trigger as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Security Error: You are not authorized to alter your user role.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists enforce_immutable_role on public.profiles;
create trigger enforce_immutable_role
  before update on public.profiles
  for each row execute procedure public.prevent_role_update();

-- 5. Trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, handle, contact_method, role, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'handle', '@' || lower(regexp_replace(split_part(new.email, '@', 1), '\s+', '_', 'g'))),
    coalesce(new.raw_user_meta_data->>'contactMethod', 'Platform Chat & Email'),
    'client', -- Strictly force 'client' on creation
    coalesce(new.raw_user_meta_data->>'avatar', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80')
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger cleanly
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- HOW TO ELEVATE YOUR ACCOUNT TO ADMIN:
-- After registering your account, run this query in Supabase SQL Editor:
--
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE email = 'YOUR_EMAIL_HERE';
--
-- ==============================================================================
