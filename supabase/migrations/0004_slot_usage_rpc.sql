-- ============================================================
-- DANGBU — 0004 replace the SECURITY DEFINER view with an RPC
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- (after 0001–0003). Idempotent: safe to re-run.
--
-- Supabase Security Advisor (Dashboard → Advisors → Security)
-- reports CRITICAL:
--   "Security Definer View — public.slot_usage is defined with the
--    SECURITY DEFINER property ... enforces Postgres permissions and
--    row level security policies of the view creator, rather than
--    that of the querying user."
--
-- The view only ever existed to expose PII-free seat counts to the
-- booking form, so it is replaced by an equivalent SECURITY DEFINER
-- function scoped to ONE branch + date. Same publicly visible
-- information, but the privilege boundary is now explicit, named,
-- and auditable instead of an implicit RLS bypass.
--
-- ⚠️ ORDERING: run this migration and deploy the updated frontend
-- close together — the old build reads the view, the new build calls
-- the function. A short window where availability checks fail (the
-- form shows "could not check table availability") is harmless: no
-- data is written or lost, and bookings simply fail closed.
--
-- Zero-downtime alternative (two steps, a couple of minutes apart):
--   1. Run only the `create or replace function …` + `grant execute`
--      statements below, SKIPPING the `drop view` line. Now the old
--      build (view) and the new build (RPC) both work.
--   2. Push the frontend and wait for Cloudflare to finish building.
--   3. Run `drop view if exists public.slot_usage;` on its own, then
--      rerun the linter — the CRITICAL finding is gone.
-- ============================================================

drop view if exists public.slot_usage;

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

-- Functions are executable by PUBLIC by default — revoke that and
-- grant only to the roles that need it.
revoke all on function public.slot_usage_for_branch_date(text, date) from public;
grant execute on function public.slot_usage_for_branch_date(text, date) to anon, authenticated;

-- ------------------------------------------------------------
-- Verify: Dashboard → Advisors → Security → "Rerun linter".
-- The "Security Definer View" finding for public.slot_usage must be
-- gone. (Other definer helpers in this schema — is_staff, is_owner,
-- reservation_by_reference, cancel_reservation_by_reference,
-- enforce_reservation_insert_limits, log_reservation_change — are
-- functions with `set search_path`, which the linter accepts.)
-- ------------------------------------------------------------
