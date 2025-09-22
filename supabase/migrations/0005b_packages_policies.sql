-- Hardening migration for packages CMS
-- Explicit RLS policies, audit triggers, and performance indexes

-- Drop existing policies to start fresh with explicit permissions
drop policy if exists packages_select_active on public.packages;
drop policy if exists packages_select_admin on public.packages;
drop policy if exists packages_insert_admin on public.packages;
drop policy if exists packages_update_admin on public.packages;
drop policy if exists packages_delete_admin on public.packages;

drop policy if exists package_features_select_active on public.package_features;
drop policy if exists package_features_select_admin on public.package_features;
drop policy if exists package_features_insert_admin on public.package_features;
drop policy if exists package_features_update_admin on public.package_features;
drop policy if exists package_features_delete_admin on public.package_features;

-- PACKAGES TABLE POLICIES

-- 1) Anonymous users can read only active packages
create policy packages_read_anon on public.packages
for select to anon
using (is_active = true);

-- 2) Authenticated users can read only active packages (same as anon)
create policy packages_read_auth on public.packages
for select to authenticated
using (is_active = true);

-- 3) Admins and superadmins can read all packages
create policy packages_read_admin on public.packages
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- 4) Admins and superadmins can insert packages
create policy packages_insert_admin on public.packages
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

-- 5) Admins and superadmins can update packages
create policy packages_update_admin on public.packages
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

-- 6) Admins and superadmins can delete packages
create policy packages_delete_admin on public.packages
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- PACKAGE FEATURES TABLE POLICIES

-- 1) Anonymous users can read features of active packages only
create policy package_features_read_anon on public.package_features
for select to anon
using (
  exists (
    select 1 from public.packages 
    where id = package_id and is_active = true
  )
);

-- 2) Authenticated users can read features of active packages only
create policy package_features_read_auth on public.package_features
for select to authenticated
using (
  exists (
    select 1 from public.packages 
    where id = package_id and is_active = true
  )
);

-- 3) Admins and superadmins can read all features
create policy package_features_read_admin on public.package_features
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- 4) Admins and superadmins can insert features
create policy package_features_insert_admin on public.package_features
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

-- 5) Admins and superadmins can update features
create policy package_features_update_admin on public.package_features
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

-- 6) Admins and superadmins can delete features
create policy package_features_delete_admin on public.package_features
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- AUDIT TRIGGER for automatic created_by/updated_by stamping
create or replace function public.stamp_package_audit()
returns trigger language plpgsql as $$
begin
  -- On INSERT, set both created_by and updated_by
  if TG_OP = 'INSERT' then
    new.created_by = auth.uid();
    new.updated_by = auth.uid();
    return new;
  end if;
  
  -- On UPDATE, only set updated_by
  if TG_OP = 'UPDATE' then
    new.updated_by = auth.uid();
    return new;
  end if;
  
  return null;
end; $$;

-- Apply audit trigger to packages table
create or replace trigger trg_packages_audit
before insert or update on public.packages
for each row execute procedure public.stamp_package_audit();

-- PERFORMANCE INDEXES

-- Index for public queries (active packages ordered by sort_index)
create index if not exists idx_packages_active_sort 
on public.packages (is_active, sort_index) 
where is_active = true;

-- Index for slug lookups (unique constraint already exists, but explicit index for performance)
create index if not exists idx_packages_slug 
on public.packages (slug);

-- Index for features by package with sort order
create index if not exists idx_package_features_package_sort 
on public.package_features (package_id, sort_index);

-- Index for admin queries (all packages by sort order)
create index if not exists idx_packages_sort_all 
on public.packages (sort_index);

-- Grant necessary permissions for anon users
grant usage on schema public to anon;
grant select on public.packages to anon;
grant select on public.package_features to anon; 