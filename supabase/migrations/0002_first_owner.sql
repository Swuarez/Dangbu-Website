-- ============================================================
-- Bootstrap the FIRST owner account.
--
-- Step 1: Supabase Dashboard → Authentication → Users →
--         "Add user" → create the owner with email + password.
-- Step 2: Copy that user's UUID from the Users table.
-- Step 3: Replace the placeholder below and run this file.
--
-- (Creating auth users requires the Dashboard or the service
--  role key — both stay server-side, never in the frontend.)
-- ============================================================

insert into public.staff_profiles (id, full_name, role)
values ('a4f31ff6-4501-4eda-820a-cf58aa690ef0', 'Owner', 'owner')
on conflict (id) do update set role = 'owner';

-- Afterwards, additional staff accounts:
--   1. Authentication → Users → Add user (their email + password)
--   2. They sign in once at /login (their profile row is created
--      by the owner on the Staff page — or insert it here):
--
-- insert into public.staff_profiles (id, full_name, role)
-- values ('STAFF-USER-UUID', 'Jane', 'staff');
