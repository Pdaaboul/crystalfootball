-- Fix circular RLS dependency causing stack overflow
-- The issue: current_role() function queries profiles table, which triggers RLS policies that call current_role()

-- Replace the current_role function with security definer to bypass RLS
create or replace function public.current_role()
returns text language sql stable security definer as $$
  select role from public.profiles where user_id = auth.uid()
$$;

-- Also fix the prevent_privilege_escalation function to bypass RLS
create or replace function public.prevent_privilege_escalation()
returns trigger language plpgsql security definer as $$
declare
  caller_role text;
begin
  -- Get the caller's role (using security definer to bypass RLS)
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