-- ============================================================
-- DANGBU Unlimited Samgyupsal & Buffet — initial schema
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to run once on a fresh project. All access is governed
-- by Row Level Security; the frontend only uses the anon key.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- staff profiles (roles for dashboard access) ----------
create table if not exists public.staff_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

alter table public.staff_profiles enable row level security;

-- ---------- reservations ----------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  full_name text not null,
  mobile text not null,
  email text,
  branch_id text not null,
  package_id text not null,
  reservation_date date not null,
  reservation_time time not null,
  guests int not null check (guests between 1 and 20),
  special_request text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservations_date_idx
  on public.reservations (reservation_date, branch_id);
create index if not exists reservations_status_idx
  on public.reservations (status);

alter table public.reservations enable row level security;

-- ---------- announcements ----------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'promo', 'warning', 'closure')),
  button_text text,
  button_url text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reservations_touch on public.reservations;
create trigger reservations_touch
  before update on public.reservations
  for each row execute function public.touch_updated_at();

drop trigger if exists announcements_touch on public.announcements;
create trigger announcements_touch
  before update on public.announcements
  for each row execute function public.touch_updated_at();

-- ---------- role helpers (security definer, stable) ----------
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.staff_profiles
    where id = auth.uid()
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.staff_profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- staff_profiles: a user can read their own profile; owners manage all.
drop policy if exists "staff read own profile" on public.staff_profiles;
create policy "staff read own profile"
  on public.staff_profiles for select
  to authenticated
  using (id = auth.uid() or public.is_owner());

drop policy if exists "owners insert profiles" on public.staff_profiles;
create policy "owners insert profiles"
  on public.staff_profiles for insert
  to authenticated
  with check (public.is_owner() or id = auth.uid());

drop policy if exists "owners update profiles" on public.staff_profiles;
create policy "owners update profiles"
  on public.staff_profiles for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "owners delete profiles" on public.staff_profiles;
create policy "owners delete profiles"
  on public.staff_profiles for delete
  to authenticated
  using (public.is_owner());

-- reservations: anyone may book (insert pending only); only staff read/update.
drop policy if exists "anyone can book" on public.reservations;
create policy "anyone can book"
  on public.reservations for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "staff read reservations" on public.reservations;
create policy "staff read reservations"
  on public.reservations for select
  to authenticated
  using (public.is_staff());

drop policy if exists "staff update reservations" on public.reservations;
create policy "staff update reservations"
  on public.reservations for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- announcements: public reads active, in-window rows; staff manage everything.
drop policy if exists "public read active announcements" on public.announcements;
create policy "public read active announcements"
  on public.announcements for select
  to anon, authenticated
  using (
    is_active
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "staff read all announcements" on public.announcements;
create policy "staff read all announcements"
  on public.announcements for select
  to authenticated
  using (public.is_staff());

drop policy if exists "staff insert announcements" on public.announcements;
create policy "staff insert announcements"
  on public.announcements for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists "staff update announcements" on public.announcements;
create policy "staff update announcements"
  on public.announcements for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "staff delete announcements" on public.announcements;
create policy "staff delete announcements"
  on public.announcements for delete
  to authenticated
  using (public.is_staff());

-- ============================================================
-- PII-FREE AGGREGATE RPC for public slot availability.
-- Exposes only time + total booked guests for ONE branch+date, so
-- the booking form can disable full slots without ever reading
-- guest personal data.
--
-- Why a function and not a view: a view defined with
-- security_invoker = false enforces the permissions/RLS of the view
-- CREATOR instead of the querying user, which Supabase's Security
-- Advisor flags as CRITICAL ("Security Definer View"). A SECURITY
-- DEFINER function is the explicit, auditable equivalent — same
-- public information, declared privilege boundary.
-- (Migration 0004 drops the old view on projects that already have it.)
-- ============================================================
create or replace function public.slot_usage_for_branch_date(
  p_branch_id text,
  p_date date
)
returns table (reservation_time time, booked_guests int)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.reservation_time,
    sum(r.guests)::int as booked_guests
  from public.reservations r
  where r.branch_id = p_branch_id
    and r.reservation_date = p_date
    and r.status in ('pending', 'confirmed')
  group by r.reservation_time;
$$;

revoke all on function public.slot_usage_for_branch_date(text, date) from public;
grant execute on function public.slot_usage_for_branch_date(text, date) to anon, authenticated;

-- ============================================================
-- Guest booking lookup by reference number (security definer).
-- A guest who knows their DANGBU-YYYY-XXXXX reference can read
-- their own booking row without any broader SELECT grant.
-- ============================================================
create or replace function public.reservation_by_reference(p_reference text)
returns setof public.reservations
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.reservations
  where reference = upper(trim(p_reference))
  limit 1;
$$;

grant execute on function public.reservation_by_reference(text) to anon, authenticated;

-- ============================================================
-- After running this file:
--   1. Authentication → Users → Add user (owner email + password)
--   2. Run 0002_first_owner.sql with that user's id
-- ============================================================
