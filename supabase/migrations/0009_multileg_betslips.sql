-- Migration: Multi-leg Betslips Support (Accumulators/Parlays)
-- Crystal Football Step 6 Enhancement: Individual leg tracking with combined odds

-- Add new columns to existing betslips table
alter table public.betslips 
add column if not exists betslip_type text not null default 'single' check (betslip_type in ('single','multi')),
add column if not exists combined_odds numeric(8,2) generated always as (
  case 
    when betslip_type = 'single' then odds_decimal
    else null  -- Will be calculated from legs
  end
) stored;

-- Create betslip legs table for multi-leg support
create table if not exists public.betslip_legs (
  id uuid primary key default gen_random_uuid(),
  betslip_id uuid not null references public.betslips(id) on delete cascade,
  leg_order int not null default 1,
  title text not null,
  description text not null,
  odds_decimal numeric(6,2) not null check (odds_decimal > 1.01),
  status text not null default 'pending' check (status in ('pending','won','lost')),
  notes text,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(betslip_id, leg_order)
);

-- Function to calculate combined odds for multi-leg betslips
create or replace function public.calculate_combined_odds(betslip_uuid uuid)
returns numeric(8,2) language plpgsql stable as $$
declare
  betslip_type_val text;
  combined_odds numeric(8,2);
begin
  -- Get betslip type
  select bt.betslip_type into betslip_type_val
  from public.betslips bt
  where bt.id = betslip_uuid;
  
  if betslip_type_val = 'single' then
    -- For single betslips, return the odds_decimal
    select bt.odds_decimal into combined_odds
    from public.betslips bt
    where bt.id = betslip_uuid;
  else
    -- For multi betslips, multiply all leg odds
    select coalesce(exp(sum(ln(bl.odds_decimal))), 1.0) into combined_odds
    from public.betslip_legs bl
    where bl.betslip_id = betslip_uuid;
  end if;
  
  return combined_odds;
end; $$;

-- Function to determine betslip outcome based on leg statuses
create or replace function public.calculate_betslip_outcome(betslip_uuid uuid)
returns text language plpgsql stable as $$
declare
  betslip_type_val text;
  leg_count int;
  won_count int;
  lost_count int;
  pending_count int;
  calculated_outcome text;
begin
  -- Get betslip type
  select bt.betslip_type into betslip_type_val
  from public.betslips bt
  where bt.id = betslip_uuid;
  
  if betslip_type_val = 'single' then
    -- For single betslips, use existing outcome logic
    select bt.outcome into calculated_outcome
    from public.betslips bt
    where bt.id = betslip_uuid;
  else
    -- For multi betslips, calculate based on leg statuses
    select 
      count(*),
      count(*) filter (where status = 'won'),
      count(*) filter (where status = 'lost'),
      count(*) filter (where status = 'pending')
    into leg_count, won_count, lost_count, pending_count
    from public.betslip_legs bl
    where bl.betslip_id = betslip_uuid;
    
    if leg_count = 0 then
      calculated_outcome := 'pending';
    elsif lost_count > 0 then
      calculated_outcome := 'lost';
    elsif won_count = leg_count then
      calculated_outcome := 'won';
    else
      calculated_outcome := 'pending';
    end if;
  end if;
  
  return calculated_outcome;
end; $$;

-- Trigger to update betslip when legs change
create or replace function public.update_betslip_from_legs()
returns trigger language plpgsql as $$
declare
  target_betslip_id uuid;
  new_combined_odds numeric(8,2);
  new_outcome text;
  new_status text;
begin
  -- Get betslip ID from the leg
  if TG_OP = 'DELETE' then
    target_betslip_id := OLD.betslip_id;
  else
    target_betslip_id := NEW.betslip_id;
  end if;
  
  -- Calculate new combined odds and outcome
  new_combined_odds := public.calculate_combined_odds(target_betslip_id);
  new_outcome := public.calculate_betslip_outcome(target_betslip_id);
  
  -- Determine status based on outcome
  if new_outcome = 'pending' then
    new_status := 'posted';
  else
    new_status := 'settled';
  end if;
  
  -- Update the betslip
  update public.betslips
  set 
    outcome = new_outcome,
    status = new_status,
    settled_at = case 
      when new_status = 'settled' and settled_at is null then now()
      when new_status = 'posted' then null
      else settled_at
    end,
    updated_at = now()
  where id = target_betslip_id;
  
  return coalesce(NEW, OLD);
end; $$;

-- Apply trigger to betslip_legs table
create or replace trigger trg_update_betslip_from_legs
after insert or update or delete on public.betslip_legs
for each row execute procedure public.update_betslip_from_legs();

-- Apply updated_at trigger to betslip_legs
create or replace trigger trg_betslip_legs_updated_at
before update on public.betslip_legs
for each row execute procedure public.set_updated_at();

-- Performance indexes for betslip_legs
create index if not exists idx_betslip_legs_betslip_id on public.betslip_legs (betslip_id);
create index if not exists idx_betslip_legs_order on public.betslip_legs (betslip_id, leg_order);
create index if not exists idx_betslip_legs_status on public.betslip_legs (status);

-- Update RLS policies for betslip_legs
alter table public.betslip_legs enable row level security;

-- RLS Policies for betslip_legs (inherit from parent betslip)
create policy betslip_legs_select on public.betslip_legs
for select to authenticated
using (
  exists (
    select 1 from public.betslips b 
    where b.id = betslip_legs.betslip_id
    and (
      public.user_has_active_subscription(auth.uid()) or
      public.current_role() in ('admin','superadmin')
    )
  )
);

-- Write access for admin/superadmin only
create policy betslip_legs_insert_admin on public.betslip_legs
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

create policy betslip_legs_update_admin on public.betslip_legs
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

create policy betslip_legs_delete_admin on public.betslip_legs
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- Grant permissions
grant select on public.betslip_legs to authenticated;
grant insert, update, delete on public.betslip_legs to authenticated;

-- Update existing single betslips to have proper type
update public.betslips 
set betslip_type = 'single' 
where betslip_type is null;

-- For single betslips, create a corresponding leg entry for consistency
insert into public.betslip_legs (betslip_id, leg_order, title, description, odds_decimal, status, notes)
select 
  b.id,
  1,
  b.title,
  coalesce(b.market_type || ': ' || b.selection, b.title),
  b.odds_decimal,
  case 
    when b.outcome = 'pending' then 'pending'
    when b.outcome = 'won' then 'won'
    when b.outcome = 'lost' then 'lost'
    else 'pending'
  end,
  b.notes
from public.betslips b
where b.betslip_type = 'single'
and not exists (
  select 1 from public.betslip_legs bl 
  where bl.betslip_id = b.id
);

-- Add helper view for easy querying of betslips with leg information
create or replace view public.betslips_with_legs as
select 
  b.*,
  public.calculate_combined_odds(b.id) as calculated_combined_odds,
  public.calculate_betslip_outcome(b.id) as calculated_outcome,
  coalesce(
    json_agg(
      json_build_object(
        'id', bl.id,
        'leg_order', bl.leg_order,
        'title', bl.title,
        'description', bl.description,
        'odds_decimal', bl.odds_decimal,
        'status', bl.status,
        'notes', bl.notes,
        'settled_at', bl.settled_at,
        'created_at', bl.created_at,
        'updated_at', bl.updated_at
      ) order by bl.leg_order
    ) filter (where bl.id is not null),
    '[]'::json
  ) as legs
from public.betslips b
left join public.betslip_legs bl on bl.betslip_id = b.id
group by b.id;

-- Grant access to the view
grant select on public.betslips_with_legs to authenticated, anon; 