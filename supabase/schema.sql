-- Nickhub multi-user schema.
-- Run this in the Supabase SQL Editor (or via `supabase db push`).
-- Every table is protected by Row Level Security so each user can only
-- read and write their own rows.

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- User settings: per-user integrations and playback preferences.
-- Debrid tokens are sensitive — they are only readable by their owner via
-- RLS, but consider Supabase Vault or server-side encryption for hardening.
create table if not exists public.user_settings (
  user_id uuid references auth.users on delete cascade primary key,
  app_name text not null default 'Nickhub',
  tmdb_api_key text,
  debrid_provider text,
  debrid_api_token text,
  binge_mode_enabled boolean not null default true,
  auto_advance_delay_seconds integer not null default 5,
  preferred_quality text not null default '1080p',
  theme text not null default 'dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can manage own profile" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can manage own settings" on public.user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at current on every settings change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row
  execute function public.set_updated_at();
