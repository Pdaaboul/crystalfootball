-- Payment Settings CMS: Admin-Configurable Payment Instructions
-- Tables: payment_methods, payment_method_fields
-- Updates: payment_receipts with method_id and context

-- PAYMENT METHODS TABLE
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('wish','crypto')),
  label text not null,
  is_active boolean not null default true,
  sort_index int not null default 0,
  notes text null,
  created_by uuid null references public.profiles(user_id) on delete set null,
  updated_by uuid null references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PAYMENT METHOD FIELDS TABLE
create table public.payment_method_fields (
  id uuid primary key default gen_random_uuid(),
  method_id uuid not null references public.payment_methods(id) on delete cascade,
  key text not null check (key in ('wish_phone','wish_name','crypto_address','crypto_coin','crypto_network','extra')),
  value text not null,
  sort_index int not null default 0,
  created_at timestamptz not null default now()
);

-- UPDATE PAYMENT RECEIPTS TABLE
alter table public.payment_receipts 
add column method_id uuid null references public.payment_methods(id) on delete set null,
add column receipt_context jsonb not null default '{}'::jsonb;

-- UPDATED_AT TRIGGER for payment_methods
create or replace trigger trg_payment_methods_updated_at
before update on public.payment_methods
for each row execute procedure public.set_updated_at();

-- AUDIT TRIGGER for payment_methods
create or replace function public.stamp_payment_method_audit()
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

create or replace trigger trg_payment_methods_audit
before insert or update on public.payment_methods
for each row execute procedure public.stamp_payment_method_audit();

-- ENABLE RLS
alter table public.payment_methods enable row level security;
alter table public.payment_method_fields enable row level security;

-- PAYMENT METHODS RLS POLICIES

-- 1) Anonymous and authenticated users can read only active payment methods
create policy payment_methods_read_active on public.payment_methods
for select to anon, authenticated
using (is_active = true);

-- 2) Admins and superadmins can read all payment methods
create policy payment_methods_read_admin on public.payment_methods
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- 3) Admins and superadmins can insert payment methods
create policy payment_methods_insert_admin on public.payment_methods
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

-- 4) Admins and superadmins can update payment methods
create policy payment_methods_update_admin on public.payment_methods
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

-- 5) Admins and superadmins can delete payment methods
create policy payment_methods_delete_admin on public.payment_methods
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- PAYMENT METHOD FIELDS RLS POLICIES

-- 1) Anonymous and authenticated users can read fields of active payment methods
create policy payment_method_fields_read_active on public.payment_method_fields
for select to anon, authenticated
using (
  exists (
    select 1 from public.payment_methods 
    where id = method_id and is_active = true
  )
);

-- 2) Admins and superadmins can read all fields
create policy payment_method_fields_read_admin on public.payment_method_fields
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- 3) Admins and superadmins can insert fields
create policy payment_method_fields_insert_admin on public.payment_method_fields
for insert to authenticated
with check (public.current_role() in ('admin','superadmin'));

-- 4) Admins and superadmins can update fields
create policy payment_method_fields_update_admin on public.payment_method_fields
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

-- 5) Admins and superadmins can delete fields
create policy payment_method_fields_delete_admin on public.payment_method_fields
for delete to authenticated
using (public.current_role() in ('admin','superadmin'));

-- PERFORMANCE INDEXES

-- Active payment methods ordered by sort_index (public queries)
create index idx_payment_methods_active_sort 
on public.payment_methods (is_active, sort_index) 
where is_active = true;

-- Payment methods by type (admin filtering)
create index idx_payment_methods_type 
on public.payment_methods (type);

-- Fields by method with sort order
create index idx_payment_method_fields_method_sort 
on public.payment_method_fields (method_id, sort_index);

-- Updated at for admin queries
create index idx_payment_methods_updated 
on public.payment_methods (updated_at desc);

-- SEED DATA: Default Payment Methods

-- Wish Money method
insert into public.payment_methods (type, label, is_active, sort_index, notes) values
('wish', 'Wish Money – Lebanon', true, 1, 'Send payment via Wish Money transfer to the details below');

-- Get the wish method ID for fields
do $$
declare
  wish_method_id uuid;
begin
  select id into wish_method_id from public.payment_methods where type = 'wish' limit 1;
  
  insert into public.payment_method_fields (method_id, key, value, sort_index) values
  (wish_method_id, 'wish_phone', '+961 XX XXX XXX', 1),
  (wish_method_id, 'wish_name', 'Crystal Football', 2),
  (wish_method_id, 'extra', 'Send exact amount and include your email in the transfer notes', 3);
end $$;

-- USDT Crypto method
insert into public.payment_methods (type, label, is_active, sort_index, notes) values
('crypto', 'USDT (TRC20)', true, 2, 'Send USDT on the TRON network to the address below');

-- Get the crypto method ID for fields
do $$
declare
  crypto_method_id uuid;
begin
  select id into crypto_method_id from public.payment_methods where type = 'crypto' and label = 'USDT (TRC20)' limit 1;
  
  insert into public.payment_method_fields (method_id, key, value, sort_index) values
  (crypto_method_id, 'crypto_coin', 'USDT', 1),
  (crypto_method_id, 'crypto_network', 'TRC20 (TRON)', 2),
  (crypto_method_id, 'crypto_address', 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 3),
  (crypto_method_id, 'extra', 'Send exact amount and save the transaction hash for your receipt', 4);
end $$;

-- Grant necessary permissions
grant usage on schema public to authenticated, anon;
grant select on public.payment_methods to authenticated, anon;
grant select on public.payment_method_fields to authenticated, anon;
grant insert, update, delete on public.payment_methods to authenticated; -- RLS will restrict to admins
grant insert, update, delete on public.payment_method_fields to authenticated; -- RLS will restrict to admins 