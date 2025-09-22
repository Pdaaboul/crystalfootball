-- Secure promotion via RPC guarded by superadmin
create or replace function public.is_superadmin()
returns boolean language sql stable as $$ select public.current_role() = 'superadmin' $$;

-- Security definer function to promote a user to admin
create or replace function public.promote_to_admin(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
 if not public.is_superadmin() then
 raise exception 'not_authorized';
 end if;
 update public.profiles set role = 'admin' where user_id = target;
end; $$;

-- Optional: demote to user
create or replace function public.demote_to_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
 if not public.is_superadmin() then
 raise exception 'not_authorized';
 end if;
 update public.profiles set role = 'user' where user_id = target;
end; $$; 