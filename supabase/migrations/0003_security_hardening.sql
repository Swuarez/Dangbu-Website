-- ============================================================
-- DANGBU — 0003 security hardening
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- (after 0001 and 0002). Idempotent: safe to re-run.
--
--   1. Idempotency key on reservations (duplicate-submit guard)
--   2. Server-side input validation (mirrors the client schema)
--   3. Insert throttle (abuse control on the public endpoint)
--   4. Guest self-service cancellation by reference
--   5. Audit log for staff reservation changes
--
-- NOTE: if you already have legacy rows that violate a new CHECK
-- (e.g. a mobile number in another format), either fix the rows
-- first or add "not valid" to that constraint.
-- ============================================================

-- ---------- 1. Idempotency key ----------
-- The browser generates one client_request_id per form session and
-- sends it with every retry. A second insert with the same key hits
-- this unique index instead of creating a duplicate booking.
alter table public.reservations
  add column if not exists client_request_id uuid;

create unique index if not exists reservations_client_request_id_key
  on public.reservations (client_request_id)
  where client_request_id is not null;

-- ---------- 2. Server-side input validation ----------
-- Defense in depth: even if the client is bypassed (curl + anon key),
-- the database rejects malformed or oversized payloads.
alter table public.reservations
  drop constraint if exists reservations_full_name_check,
  add constraint reservations_full_name_check
    check (char_length(full_name) between 2 and 80);

alter table public.reservations
  drop constraint if exists reservations_mobile_check,
  add constraint reservations_mobile_check
    check (mobile ~ '^(\+639|09)\d{9}$');

alter table public.reservations
  drop constraint if exists reservations_email_check,
  add constraint reservations_email_check
    check (
      email is null
      or (char_length(email) <= 120 and email ~ '^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$')
    );

alter table public.reservations
  drop constraint if exists reservations_special_request_check,
  add constraint reservations_special_request_check
    check (special_request is null or char_length(special_request) <= 500);

alter table public.reservations
  drop constraint if exists reservations_reference_check,
  add constraint reservations_reference_check
    check (reference ~ '^DANGBU-\d{4}-[A-Z0-9]{5,12}$');

alter table public.reservations
  drop constraint if exists reservations_ids_check,
  add constraint reservations_ids_check
    check (char_length(branch_id) <= 40 and char_length(package_id) <= 40);

-- Announcement links: https:// or site-relative only. Blocks
-- javascript: / data: URLs from ever reaching the public page.
alter table public.announcements
  drop constraint if exists announcements_button_url_check,
  add constraint announcements_button_url_check
    check (button_url is null or button_url ~ '^(https://|/[^/])');

alter table public.announcements
  drop constraint if exists announcements_lengths_check,
  add constraint announcements_lengths_check
    check (
      char_length(title) <= 120
      and char_length(message) <= 500
      and (button_text is null or char_length(button_text) <= 40)
    );

-- ---------- 3. Insert throttle (per-guest abuse control) ----------
-- The anon INSERT policy is intentionally public so guests can book;
-- this trigger caps how much one mobile number can create.
-- Security definer so the count sees all rows regardless of RLS.
create or replace function public.enforce_reservation_insert_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- One guest may hold at most 3 active bookings for the same day.
  if (
    select count(*)
    from public.reservations
    where mobile = new.mobile
      and reservation_date = new.reservation_date
      and status in ('pending', 'confirmed')
  ) >= 3 then
    raise exception 'reservation_limit_reached' using errcode = 'P0001';
  end if;

  -- One guest may submit at most 10 booking requests per calendar day.
  if (
    select count(*)
    from public.reservations
    where mobile = new.mobile
      and created_at >= date_trunc('day', now())
  ) >= 10 then
    raise exception 'reservation_rate_limited' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists reservations_insert_limits on public.reservations;
create trigger reservations_insert_limits
  before insert on public.reservations
  for each row execute function public.enforce_reservation_insert_limits();

-- ---------- 4. Guest self-service cancellation ----------
-- Anyone holding the reference can cancel THEIR OWN upcoming booking
-- (the reference is the bearer credential, same as the lookup function).
create or replace function public.cancel_reservation_by_reference(p_reference text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int;
begin
  update public.reservations
  set status = 'cancelled'
  where reference = upper(trim(p_reference))
    and status in ('pending', 'confirmed')
    and reservation_date >= current_date;

  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

grant execute on function public.cancel_reservation_by_reference(text) to anon, authenticated;

-- ---------- 5. Audit log for staff reservation changes ----------
-- Records WHO changed WHAT (status / notes flag) and WHEN.
-- Never stores passwords, tokens, or full record payloads.
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  actor_role text,
  action text not null,
  reservation_reference text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

drop policy if exists "staff read audit log" on public.audit_log;
create policy "staff read audit log"
  on public.audit_log for select
  to authenticated
  using (public.is_staff());

create or replace function public.log_reservation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Guest-facing changes have no authenticated actor; skip them.
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and (old.status is distinct from new.status
          or old.internal_notes is distinct from new.internal_notes) then
    insert into public.audit_log (actor, actor_role, action, reservation_reference, detail)
    values (
      auth.uid(),
      (select role from public.staff_profiles where id = auth.uid()),
      'reservation_update',
      new.reference,
      jsonb_build_object(
        'old_status', old.status,
        'new_status', new.status,
        'notes_changed', old.internal_notes is distinct from new.internal_notes
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists reservations_audit on public.reservations;
create trigger reservations_audit
  after update on public.reservations
  for each row execute function public.log_reservation_change();

