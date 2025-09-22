-- Seed a superadmin profile (create the user in Supabase Auth UI first and copy its UUID)
-- Replace the placeholder below before running:
-- select id from auth.users where email = 'OWNER_EMAIL_HERE';
insert into public.profiles (user_id, display_name, role, referral_code)
values ('REPLACE_WITH_OWNER_USER_ID', 'Owner', 'superadmin', null)
on conflict (user_id) do update set role = excluded.role; 