-- Packages table
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tier text not null check (tier in ('monthly','half_season','full_season')),
  description text,
  duration_days int not null check (duration_days > 0),
  price_cents int not null check (price_cents > 0),
  original_price_cents int null check (original_price_cents is null or original_price_cents > price_cents),
  is_active boolean not null default true,
  sort_index int not null default 100,
  created_by uuid references public.profiles(user_id) on delete set null,
  updated_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated at trigger for packages (reuse existing function)
create or replace trigger trg_packages_updated_at
before update on public.packages
for each row execute procedure public.set_updated_at();

-- Package features table
create table public.package_features (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  label text not null,
  sort_index int not null default 100
);

-- Unique constraint to avoid duplicate features per package
alter table public.package_features 
add constraint uq_feature_per_package unique (package_id, label);

-- Enable RLS on both tables
alter table public.packages enable row level security;
alter table public.package_features enable row level security;

-- RLS Policies for packages
-- 1) Public and authenticated users can select only active packages
create policy packages_select_active on public.packages
for select to anon, authenticated
using (is_active = true);

-- 2) Admins and superadmins can select all packages
create policy packages_select_admin on public.packages
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- 3) Only admins and superadmins can insert packages
create policy packages_insert_admin on public.packages
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

-- 4) Only admins and superadmins can update packages
create policy packages_update_admin on public.packages
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

-- 5) Only admins and superadmins can delete packages
create policy packages_delete_admin on public.packages
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- RLS Policies for package_features
-- 1) Public and authenticated can select features of active packages
create policy package_features_select_active on public.package_features
for select to anon, authenticated
using (
  exists (
    select 1 from public.packages 
    where id = package_id and is_active = true
  )
);

-- 2) Admins and superadmins can select all features
create policy package_features_select_admin on public.package_features
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- 3) Only admins and superadmins can insert features
create policy package_features_insert_admin on public.package_features
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

-- 4) Only admins and superadmins can update features
create policy package_features_update_admin on public.package_features
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

-- 5) Only admins and superadmins can delete features
create policy package_features_delete_admin on public.package_features
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- Seed Crystal Football packages
insert into public.packages (slug, name, tier, description, duration_days, price_cents, original_price_cents, sort_index, is_active)
values 
  ('monthly', 'Monthly Plan', 'monthly', '30-day access to daily recommendations, stats, VIP systems', 30, 5000, null, 10, true),
  ('half-season', 'Half-Season Plan', 'half_season', '5 months access with priority support and monthly reports', 150, 22500, 25000, 20, true),
  ('full-season', 'Full Season Plan', 'full_season', '10 months access with early picks, VIP referral tier, and deep-dive reports', 300, 40000, 50000, 30, true);

-- Seed package features
-- Monthly Plan features
insert into public.package_features (package_id, label, sort_index)
select id, 'Full access to all daily recommendations and professional analyses', 10
from public.packages where slug = 'monthly'
union
select id, 'Instant notifications for new recommendations', 20
from public.packages where slug = 'monthly'
union
select id, 'Access to the statistics page (winning & losing slips)', 30
from public.packages where slug = 'monthly'
union
select id, 'Weekly performance tracking of the group', 40
from public.packages where slug = 'monthly'
union
select id, 'Exclusive access to the Three-Way System and Black Bet Protocol', 50
from public.packages where slug = 'monthly';

-- Half-Season Plan features (includes Monthly + additional)
insert into public.package_features (package_id, label, sort_index)
select id, 'Full access to all daily recommendations and professional analyses', 10
from public.packages where slug = 'half-season'
union
select id, 'Instant notifications for new recommendations', 20
from public.packages where slug = 'half-season'
union
select id, 'Access to the statistics page (winning & losing slips)', 30
from public.packages where slug = 'half-season'
union
select id, 'Weekly performance tracking of the group', 40
from public.packages where slug = 'half-season'
union
select id, 'Exclusive access to the Three-Way System and Black Bet Protocol', 50
from public.packages where slug = 'half-season'
union
select id, 'One Golden Ticket to enter an exclusive draw', 60
from public.packages where slug = 'half-season'
union
select id, 'Priority customer support & faster responses', 70
from public.packages where slug = 'half-season'
union
select id, 'Detailed monthly performance reports', 80
from public.packages where slug = 'half-season';

-- Full Season Plan features (includes Half-Season + additional)
insert into public.package_features (package_id, label, sort_index)
select id, 'Full access to all daily recommendations and professional analyses', 10
from public.packages where slug = 'full-season'
union
select id, 'Instant notifications for new recommendations', 20
from public.packages where slug = 'full-season'
union
select id, 'Access to the statistics page (winning & losing slips)', 30
from public.packages where slug = 'full-season'
union
select id, 'Weekly performance tracking of the group', 40
from public.packages where slug = 'full-season'
union
select id, 'Exclusive access to the Three-Way System and Black Bet Protocol', 50
from public.packages where slug = 'full-season'
union
select id, 'One Golden Ticket to enter an exclusive draw', 60
from public.packages where slug = 'full-season'
union
select id, 'Priority customer support & faster responses', 70
from public.packages where slug = 'full-season'
union
select id, 'Detailed monthly performance reports', 80
from public.packages where slug = 'full-season'
union
select id, '2 Golden Tickets with special rewards', 90
from public.packages where slug = 'full-season'
union
select id, 'Early access to recommendations (Priority Access)', 100
from public.packages where slug = 'full-season'
union
select id, 'Comprehensive seasonal reports & in-depth analyses', 110
from public.packages where slug = 'full-season'
union
select id, 'Special membership in the VIP Referral Program with higher commission', 120
from public.packages where slug = 'full-season'; 