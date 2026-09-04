-- ==============================================================================
-- Brewster Creative — Phase 1: Profiles & Role-Based Access Control
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

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

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. RLS Policies
-- Users can view their own profile, and admins can view all profiles
create policy "Users can view profile"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

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
