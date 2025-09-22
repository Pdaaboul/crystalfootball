-- Subscriptions Core: Manual Payment Subscriptions Flow
-- Tables: subscriptions, payment_receipts
-- RLS policies, audit triggers, and performance indexes

-- SUBSCRIPTIONS TABLE
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','active','expired','rejected')),
  start_at timestamptz null,
  end_at timestamptz null,
  notes text null,
  created_by uuid null references public.profiles(user_id) on delete set null,
  updated_by uuid null references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PAYMENT RECEIPTS TABLE
create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  method text not null check (method in ('wish','crypto')),
  reference text not null,
  receipt_url text not null,
  submitted_at timestamptz not null default now(),
  verified_by uuid null references public.profiles(user_id) on delete set null,
  verified_at timestamptz null,
  created_at timestamptz not null default now()
);

-- UPDATED_AT TRIGGERS (reuse existing function)
create or replace trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

-- AUDIT TRIGGER for subscriptions
create or replace function public.stamp_subscription_audit()
returns trigger language plpgsql as $$
begin
  -- On INSERT, set both created_by and updated_by
  if TG_OP = 'INSERT' then
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    return NEW;
  end if;
  
  -- On UPDATE, only set updated_by
  if TG_OP = 'UPDATE' then
    NEW.updated_by = auth.uid();
    return NEW;
  end if;
  
  return null;
end; $$;

create or replace trigger trg_subscriptions_audit
before insert or update on public.subscriptions
for each row execute procedure public.stamp_subscription_audit();

-- GUARD TRIGGER to prevent changing user_id or package_id after creation
create or replace function public.prevent_subscription_key_changes()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' then
    if OLD.user_id != NEW.user_id then
      raise exception 'Cannot change subscription user_id after creation';
    end if;
    
    if OLD.package_id != NEW.package_id then
      raise exception 'Cannot change subscription package_id after creation';
    end if;
  end if;
  
  return NEW;
end; $$;

create or replace trigger trg_prevent_subscription_key_changes
before update on public.subscriptions
for each row execute procedure public.prevent_subscription_key_changes();

-- ENABLE RLS
alter table public.subscriptions enable row level security;
alter table public.payment_receipts enable row level security;

-- SUBSCRIPTIONS RLS POLICIES

-- 1) Users can insert subscriptions only for themselves with default pending status
create policy subscriptions_insert_self on public.subscriptions
for insert to authenticated
with check (
  user_id = auth.uid() 
  and status = 'pending'
  and start_at is null 
  and end_at is null
);

-- 2) Users can select their own subscriptions
create policy subscriptions_select_self on public.subscriptions
for select to authenticated
using (user_id = auth.uid());

-- 3) Users can update their own subscriptions with restrictions
create policy subscriptions_update_self on public.subscriptions
for update to authenticated
using (user_id = auth.uid() and status = 'pending')
with check (
  user_id = auth.uid() 
  and status = 'pending'
  and start_at is null 
  and end_at is null
);

-- 4) Admins and superadmins can select all subscriptions
create policy subscriptions_select_admin on public.subscriptions
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- 5) Admins and superadmins can update all subscriptions (full access)
create policy subscriptions_update_admin on public.subscriptions
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

-- 6) Admins and superadmins can delete subscriptions (for error correction)
create policy subscriptions_delete_admin on public.subscriptions
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- PAYMENT RECEIPTS RLS POLICIES

-- 1) Users can insert receipts only for their own pending subscriptions
create policy payment_receipts_insert_self on public.payment_receipts
for insert to authenticated
with check (
  exists (
    select 1 from public.subscriptions 
    where id = subscription_id 
    and user_id = auth.uid() 
    and status = 'pending'
  )
);

-- 2) Users can select their own receipts
create policy payment_receipts_select_self on public.payment_receipts
for select to authenticated
using (
  exists (
    select 1 from public.subscriptions 
    where id = subscription_id 
    and user_id = auth.uid()
  )
);

-- 3) Admins and superadmins can select all receipts
create policy payment_receipts_select_admin on public.payment_receipts
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- 4) Admins and superadmins can update receipts (for verification)
create policy payment_receipts_update_admin on public.payment_receipts
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

-- 5) Admins and superadmins can delete receipts (for error correction)
create policy payment_receipts_delete_admin on public.payment_receipts
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- PERFORMANCE INDEXES

-- Subscription queries by user and status
create index idx_subscriptions_user_status 
on public.subscriptions (user_id, status);

-- Admin queries by status and creation date
create index idx_subscriptions_status_created 
on public.subscriptions (status, created_at desc);

-- Expiry scans for automated processing
create index idx_subscriptions_end_at 
on public.subscriptions (end_at) 
where end_at is not null;

-- Partial index for pending subscriptions (most frequent admin queries)
create index idx_subscriptions_pending 
on public.subscriptions (created_at desc) 
where status = 'pending';

-- Receipt queries by subscription
create index idx_payment_receipts_subscription 
on public.payment_receipts (subscription_id);

-- Admin verification queries
create index idx_payment_receipts_verified 
on public.payment_receipts (verified_at, verified_by) 
where verified_at is not null;

-- SUBSCRIPTION AUDIT EVENTS TABLE
create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  actor_user_id uuid not null references public.profiles(user_id) on delete cascade,
  action text not null check (action in ('created','submitted_payment','approved','rejected','expired','updated')),
  notes text null,
  created_at timestamptz not null default now()
);

-- Enable RLS on subscription events
alter table public.subscription_events enable row level security;

-- Users can read events for their own subscriptions
create policy subscription_events_select_self on public.subscription_events
for select to authenticated
using (
  exists (
    select 1 from public.subscriptions 
    where id = subscription_id 
    and user_id = auth.uid()
  )
);

-- Admins can read all events
create policy subscription_events_select_admin on public.subscription_events
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- Only admins can insert events (through server actions)
create policy subscription_events_insert_admin on public.subscription_events
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

-- Index for event queries
create index idx_subscription_events_subscription 
on public.subscription_events (subscription_id, created_at desc);

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant select, insert, update on public.subscriptions to authenticated;
grant select, insert, update on public.payment_receipts to authenticated;
grant select, insert on public.subscription_events to authenticated;
grant delete on public.payment_receipts to authenticated; -- Only for admins via RLS
grant delete on public.subscriptions to authenticated; -- Only for admins via RLS 