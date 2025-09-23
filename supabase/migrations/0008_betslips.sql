-- Migration: Betslips CMS + P/L Engine
-- Crystal Football Step 6: AI-backed betslips with P&L tracking

-- Enable necessary extensions
create extension if not exists pgcrypto;

-- Betslips table - core VIP predictions
create table if not exists public.betslips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  league text not null,
  event_datetime timestamptz not null,
  home_team text not null,
  away_team text not null,
  market_type text not null,
  selection text not null,
  odds_decimal numeric(6,2) not null check (odds_decimal > 1.01),
  confidence_pct int not null check (confidence_pct >= 0 and confidence_pct <= 100),
  stake_units numeric(8,2) not null default 1.0 check (stake_units > 0),
  status text not null default 'posted' check (status in ('posted','settled','void')),
  outcome text not null default 'pending' check (outcome in ('pending','won','lost','void')),
  notes text,
  is_vip boolean not null default true,
  min_tier text not null default 'monthly' check (min_tier in ('monthly','half_season','full_season')),
  posted_at timestamptz not null default now(),
  settled_at timestamptz,
  created_by uuid references public.profiles(user_id) on delete set null,
  updated_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Betslip tags table for categorization
create table if not exists public.betslip_tags (
  id uuid primary key default gen_random_uuid(),
  betslip_id uuid not null references public.betslips(id) on delete cascade,
  tag text not null,
  unique(betslip_id, tag)
);

-- Leaderboard highlights table for public marketing
create table if not exists public.leaderboard_highlights (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  location text,
  headline text,
  description text,
  won_amount_usd numeric(12,2),
  period_label text,
  link_url text,
  sort_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional P&L snapshots table (empty implementation for future)
create table if not exists public.pnl_snapshots (
  id uuid primary key default gen_random_uuid(),
  period_start timestamptz not null,
  period_end timestamptz not null,
  total_betslips int not null default 0,
  won_count int not null default 0,
  lost_count int not null default 0,
  void_count int not null default 0,
  total_units_staked numeric(12,2) not null default 0,
  total_units_won numeric(12,2) not null default 0,
  net_profit_units numeric(12,2) not null default 0,
  roi_percentage numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(period_start, period_end)
);

-- Apply updated_at trigger to betslips and leaderboard_highlights
create or replace trigger trg_betslips_updated_at
before update on public.betslips
for each row execute procedure public.set_updated_at();

create or replace trigger trg_leaderboard_highlights_updated_at
before update on public.leaderboard_highlights
for each row execute procedure public.set_updated_at();

-- Audit trigger for betslips (sets created_by/updated_by from auth.uid())
create or replace function public.stamp_betslip_audit()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    new.created_by = auth.uid();
    new.updated_by = auth.uid();
  elsif TG_OP = 'UPDATE' then
    new.updated_by = auth.uid();
    -- Preserve original created_by
    new.created_by = old.created_by;
  end if;
  return new;
end; $$;

create or replace trigger trg_betslips_audit
before insert or update on public.betslips
for each row execute procedure public.stamp_betslip_audit();

-- Performance indexes
create index if not exists idx_betslips_posted_at on public.betslips (posted_at desc);
create index if not exists idx_betslips_status on public.betslips (status);
create index if not exists idx_betslips_outcome on public.betslips (outcome);
create index if not exists idx_betslips_event_datetime on public.betslips (event_datetime);
create index if not exists idx_betslips_min_tier on public.betslips (min_tier);
create index if not exists idx_betslips_is_vip on public.betslips (is_vip);
create index if not exists idx_betslip_tags_betslip on public.betslip_tags (betslip_id);
create index if not exists idx_leaderboard_active_sort on public.leaderboard_highlights (is_active, sort_index);
create index if not exists idx_pnl_snapshots_period on public.pnl_snapshots (period_start, period_end);

-- Enable Row Level Security
alter table public.betslips enable row level security;
alter table public.betslip_tags enable row level security;
alter table public.leaderboard_highlights enable row level security;
alter table public.pnl_snapshots enable row level security;

-- Helper function to check if user has active subscription
create or replace function public.user_has_active_subscription(user_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.subscriptions s 
    where s.user_id = user_has_active_subscription.user_id 
    and s.status = 'active' 
    and s.end_at > now()
  )
$$;

-- RLS Policies for betslips
-- Select: Active subscribers OR admin/superadmin
create policy betslips_select_subscribers on public.betslips
for select to authenticated
using (
  public.user_has_active_subscription(auth.uid()) or
  public.current_role() in ('admin','superadmin')
);

-- Insert/Update/Delete: Admin/superadmin only
create policy betslips_insert_admin on public.betslips
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

create policy betslips_update_admin on public.betslips
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

create policy betslips_delete_admin on public.betslips
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- RLS Policies for betslip_tags
-- Select: Same visibility as parent betslip
create policy betslip_tags_select on public.betslip_tags
for select to authenticated
using (
  exists (
    select 1 from public.betslips b 
    where b.id = betslip_tags.betslip_id
    and (
      public.user_has_active_subscription(auth.uid()) or
      public.current_role() in ('admin','superadmin')
    )
  )
);

-- Write: Admin/superadmin only
create policy betslip_tags_insert_admin on public.betslip_tags
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

create policy betslip_tags_update_admin on public.betslip_tags
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

create policy betslip_tags_delete_admin on public.betslip_tags
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- RLS Policies for leaderboard_highlights
-- Select: Allow anonymous and authenticated (public marketing)
create policy leaderboard_select_public on public.leaderboard_highlights
for select to anon, authenticated
using (true);

-- Write: Admin/superadmin only
create policy leaderboard_insert_admin on public.leaderboard_highlights
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

create policy leaderboard_update_admin on public.leaderboard_highlights
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

create policy leaderboard_delete_admin on public.leaderboard_highlights
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- RLS Policies for pnl_snapshots
-- Select: Admin/superadmin only (sensitive performance data)
create policy pnl_snapshots_select_admin on public.pnl_snapshots
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- Write: Admin/superadmin only
create policy pnl_snapshots_insert_admin on public.pnl_snapshots
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

create policy pnl_snapshots_update_admin on public.pnl_snapshots
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

create policy pnl_snapshots_delete_admin on public.pnl_snapshots
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- Grant necessary permissions
grant usage on schema public to authenticated, anon;
grant select on public.betslips to authenticated;
grant select on public.betslip_tags to authenticated;
grant select on public.leaderboard_highlights to authenticated, anon;
grant select on public.pnl_snapshots to authenticated;
grant insert, update, delete on public.betslips to authenticated;
grant insert, update, delete on public.betslip_tags to authenticated;
grant insert, update, delete on public.leaderboard_highlights to authenticated;
grant insert, update, delete on public.pnl_snapshots to authenticated; 