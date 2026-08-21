-- ============================================================
-- JayMap — Profiles v1
-- 2026-08-18
-- ============================================================

begin;

-- ============================================================
-- 1. Profiles
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  display_name text,
  avatar_url text,

  contact_phone text,
  contact_email text,

  bio text,

  role text not null default 'user'
    check (
      role in (
        'user',
        'realtor',
        'admin'
      )
    ),

  verification_status text not null default 'unverified'
    check (
      verification_status in (
        'unverified',
        'pending',
        'verified',
        'rejected'
      )
    ),

  onboarding_completed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. Indexes
-- ============================================================

create index if not exists idx_profiles_role
  on public.profiles(role);

create index if not exists idx_profiles_verification_status
  on public.profiles(verification_status);

-- ============================================================
-- 3. updated_at trigger
-- ============================================================

drop trigger if exists profiles_updated_at
  on public.profiles;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at();

-- ============================================================
-- 4. Automatically create profile after Supabase Auth signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_avatar_url text;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'preferred_username'), '')
  );

  v_avatar_url := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
  );

  insert into public.profiles (
    id,
    display_name,
    avatar_url,
    contact_email,
    onboarding_completed
  )
  values (
    new.id,
    v_display_name,
    v_avatar_url,
    new.email,
    v_display_name is not null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created
  on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- 5. RLS
-- ============================================================

alter table public.profiles
  enable row level security;

-- Пользователь видит только свой полный профиль.
drop policy if exists "profiles_select_own"
  on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Пользователь может изменить только свой профиль.
drop policy if exists "profiles_update_own"
  on public.profiles;

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

commit;