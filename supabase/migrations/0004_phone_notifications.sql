-- Add phone number and WhatsApp fields to profiles table
alter table public.profiles 
add column if not exists phone_e164 text unique,
add column if not exists whatsapp_opt_in boolean not null default false,
add column if not exists whatsapp_verified_at timestamptz;

-- Create notification_events table for WhatsApp notifications
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  recipient_phone_e164 text not null,
  kind text not null check (kind in ('payment_pending','subscription_expiring')),
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- Enable RLS on notification_events
alter table public.notification_events enable row level security;

-- Policies for notification_events
-- 1) Authenticated users can insert when recipient_phone_e164 is not null and they are authenticated
create policy notification_events_insert_auth on public.notification_events
for insert to authenticated
with check (
  recipient_phone_e164 is not null 
  and auth.uid() is not null
);

-- 2) Users can select only their own events where payload->>'user_id' matches their auth.uid()
create policy notification_events_select_own on public.notification_events
for select to authenticated
using (payload->>'user_id' = auth.uid()::text);

-- 3) Admins and superadmins can select all notification events
create policy notification_events_select_admin on public.notification_events
for select to authenticated
using (public.current_role() in ('admin','superadmin'));

-- 4) Admins and superadmins can update status of notification events
create policy notification_events_update_admin on public.notification_events
for update to authenticated
using (public.current_role() in ('admin','superadmin'))
with check (public.current_role() in ('admin','superadmin'));

-- RPC function to enqueue notifications (admin/superadmin only)
create or replace function public.enqueue_notification(
  p_phone text,
  p_kind text,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
begin
  -- Check if caller is admin or superadmin
  if not (public.current_role() in ('admin','superadmin')) then
    raise exception 'insufficient_privileges';
  end if;

  -- Validate kind parameter
  if p_kind not in ('payment_pending','subscription_expiring') then
    raise exception 'invalid_notification_kind';
  end if;

  -- Insert notification event
  insert into public.notification_events (recipient_phone_e164, kind, payload)
  values (p_phone, p_kind, p_payload)
  returning id into notification_id;

  return notification_id;
end; $$;

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant select, insert on public.notification_events to authenticated;
grant update (status, error, sent_at) on public.notification_events to authenticated; 