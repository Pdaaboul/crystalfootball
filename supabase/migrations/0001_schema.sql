-- Enable extension used for UUIDs
create extension if not exists pgcrypto;

-- Profiles table
create table if not exists public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 role text not null default 'user' check (role in ('user','admin','superadmin')),
 referral_code text unique,
 referred_by uuid null references public.profiles(user_id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint no_self_referral check (referred_by is null or referred_by <> user_id)
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create or replace trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Prevent non-superadmins from changing privileged fields
create or replace function public.prevent_privilege_escalation()
returns trigger language plpgsql as $$
declare
  caller_role text;
begin
  -- Get the caller's role
  select role into caller_role from public.profiles where user_id = auth.uid();
  
  -- Allow superadmins to change anything
  if caller_role = 'superadmin' then
    return new;
  end if;
  
  -- For non-superadmins, prevent changes to role and referred_by
  if old.role != new.role then
    raise exception 'Only superadmins can change user roles';
  end if;
  
  if old.referred_by != new.referred_by or (old.referred_by is null and new.referred_by is not null) or (old.referred_by is not null and new.referred_by is null) then
    raise exception 'Only superadmins can change referral relationships';
  end if;
  
  return new;
end; $$;

create or replace trigger trg_prevent_privilege_escalation
before update on public.profiles
for each row execute procedure public.prevent_privilege_escalation();

-- Minimal auth events audit table
create table if not exists public.auth_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references public.profiles(user_id) on delete set null,
 event text not null,
 ip text,
 user_agent text,
 created_at timestamptz not null default now()
);

-- RLS on
alter table public.profiles enable row level security;
alter table public.auth_events enable row level security;

-- Helper: check caller role via profiles
create or replace function public.current_role()
returns text language sql stable as $$
 select role from public.profiles where user_id = auth.uid()
$$;

-- Policies: PROFILES
-- 1) Everyone authenticated can insert their own profile exactly once
create policy profiles_insert_self on public.profiles
for insert to authenticated
with check (user_id = auth.uid() and role = 'user');

-- 2) Users can select their own row
create policy profiles_select_self on public.profiles
for select to authenticated
using (user_id = auth.uid());

-- 3) Admins & Superadmins can select all
create policy profiles_select_admins on public.profiles
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- 4) Users can update their own profiles (trigger prevents privilege escalation)
create policy profiles_update_self on public.profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 5) Superadmin can update any row (including role and referred_by)
create policy profiles_update_superadmin on public.profiles
for update to authenticated
using (public.current_role() = 'superadmin')
with check (public.current_role() = 'superadmin');

-- Deny deletes for now (no delete policy)

-- Policies: AUTH EVENTS
-- Insert own events
create policy auth_events_insert_self on public.auth_events
for insert to authenticated
with check (user_id = auth.uid());
-- Superadmin can select all
create policy auth_events_select_superadmin on public.auth_events
for select to authenticated
using (public.current_role() = 'superadmin');
-- Users can select their own
create policy auth_events_select_self on public.auth_events
for select to authenticated
using (user_id = auth.uid()); 