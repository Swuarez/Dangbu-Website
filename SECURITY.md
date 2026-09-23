# Security — DANGBU Unlimited Samgyupsal & Buffet

Audit date: **23 September 2026** · Scope: full repository (React 19 + Vite 6 SPA, Supabase
backend, Cloudflare/Vercel static hosting). This document lists what was found, what was fixed
in code, and what still requires manual configuration in a dashboard.

---

## 1. How this app is secured

| Layer | Control |
| --- | --- |
| Hosting | Static SPA on Cloudflare Workers Static Assets (or Pages / Vercel). No server code, so no server to patch — but also no place to put custom middleware. |
| Transport | HTTPS everywhere + `Strict-Transport-Security` (§3), `upgrade-insecure-requests` in the CSP. |
| Auth | Supabase Auth (email + password). Passwords are hashed with **bcrypt inside Supabase** — no password ever touches our code or database. Sessions are short-lived JWTs that auto-refresh. |
| Authorization | **Row Level Security on every table.** The browser only ever holds the publishable (anon) key; RLS decides what it can read/write. Role checks (`staff`, `owner`) run in `security definer` helpers, never from client claims. |
| Guest PII | Public reads are PII-free: slot availability comes from the `slot_usage_for_branch_date` aggregate RPC; a guest's own booking is reachable only through `reservation_by_reference()` with the reference number. |
| Input | Zod schema client-side **plus** CHECK constraints server-side (migration `0003`). |
| Output | React escapes all rendered text; no `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or `new Function` anywhere in the codebase. Announcement links are allow-listed to `https://` or site-relative paths. |
| Abuse control | Per-mobile booking throttle, booking idempotency, login backoff, Supabase auth rate limits, Cloudflare WAF/Bot Fight (manual). |
| Audit | `audit_log` table records staff reservation changes (actor, role, old/new status, timestamp). |

**Not applicable by design** (verified, not skipped):

- **Card data / PCI DSS** — the site takes **no payments**. Prices are display estimates; bills are
  settled in person. No card number, CVV, or processor token exists anywhere in the code, schema, or
  logs. If online payment is ever added, use a hosted processor flow (Stripe Checkout / PayMongo
  hosted page) so raw card data never reaches this codebase.
- **Cookie flags / CSRF tokens** — the app sets **no cookies**. `supabase-js` keeps its JWT in
  `localStorage` and sends it as a bearer header, so there is no ambient credential for a cross-site
  request to ride on. (If you ever move to cookie-based sessions, add
  `HttpOnly; Secure; SameSite=Strict` **and** CSRF tokens at the same time.)
- **File uploads / malware scanning** — there is no upload feature anywhere.
- **SQL/NoSQL injection** — no hand-built SQL in the app; all access goes through PostgREST's
  parameterised query builder. The dashboard's free-text search is the only string-built filter, and
  it strips PostgREST's control characters (`% , ( )`) before use.

---

## 2. Findings and fixes

### SEC-00 · Critical — SECURITY DEFINER view `slot_usage` (Supabase Security Advisor)

*Finding:* slot availability was exposed as
`create view public.slot_usage with (security_invoker = false)`. A view created that way runs with
the **view creator's** permissions and RLS context, so every anon query silently bypassed the
querying user's policies. Supabase's linter reports this as CRITICAL because the escalation is
implicit — exactly the kind of thing that goes unnoticed when someone later adds a column to the
underlying table.
*Status:* **Fixed** — migration `0004_slot_usage_rpc.sql` drops the view and replaces it with
`slot_usage_for_branch_date(p_branch_id text, p_date date)`, a `SECURITY DEFINER` **function** that
returns only `reservation_time` + summed `booked_guests` for one branch and date. Same publicly
visible information, but the boundary is now explicit, scoped to two parameters, and declared;
`EXECUTE` is revoked from `PUBLIC` and granted only to `anon` / `authenticated`. The frontend was
switched to `supabase.rpc("slot_usage_for_branch_date", …)`, and `0001_initial_schema.sql` was
updated so fresh installs never create the definer view in the first place.
*Manual:* run `0004` in the SQL Editor, then **Advisors → Security → Rerun linter** — the finding
disappears. Deploy the updated frontend at the same time (the old build reads the view, the new
build calls the RPC).

### SEC-01 · Low — Real Supabase project URL + publishable key in `.env.example`

*Finding:* `.env.example` shipped the live project ref and publishable key instead of placeholders,
sitting in the working tree where it could easily be committed next.
*Status:* **Fixed** — placeholders restored with a rotation note. `git grep` confirms no tracked
file contains the live ref/key. Publishable keys are designed to be public, but a committed one
invites anonymous quota abuse.
*Manual:* rotate if it was ever pushed (Project Settings → API Keys), then update `.env` + host env vars.

### SEC-02 · High — No security headers (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy)

*Finding:* the deployed site sent no `Content-Security-Policy` or other hardening headers, so any
XSS foothold (compromised dependency, compromised staff account) had a free hand, and the site could
be framed for clickjacking.
*Status:* **Fixed** — `public/_headers` (Cloudflare Pages **and** Workers Static Assets, since Vite
copies it into `dist/`) plus a matching `headers` block in `vercel.json`. Policy: `default-src 'self'`,
`script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
`frame-ancestors 'none'`, `connect-src` limited to `https://*.supabase.co` + `wss://*.supabase.co`,
Google Fonts allow-listed for styles/fonts, plus HSTS (2 years, includeSubDomains, preload) and
`Permissions-Policy` locking camera/mic/geolocation/payment.
*Manual:* enable **Always Use HTTPS** + **HSTS** in Cloudflare too, and re-check the browser console
after deploy (CSP changes are the one thing worth eyeballing live).

### SEC-03 · Medium — Stored XSS via announcement button URLs

*Finding:* `announcements.button_url` was rendered straight into `<a href>`; a staff account (or
anyone who obtained one) could save `javascript:...` and execute script in every visitor's browser.
*Status:* **Fixed in three layers** — allow-list helper at render time (`safeAnnouncementUrl`),
validation in the dashboard editor, and a DB CHECK constraint
`button_url is null or button_url ~ '^(https://|/[^/])'`.

### SEC-04 · Medium — Guessable reservation references

*Finding:* references were `DANGBU-YYYY-XXXXX` with a 5-character suffix (31^5 ≈ 28.6 M) and the
lookup RPC is unauthenticated by design, so references were enumerable — each hit leaks a guest's
name, mobile, and email.
*Status:* **Hardened** — suffix raised to 8 characters (31^8 ≈ 8.5 × 10¹¹) in `generateReference`.
*Residual:* the reference is still a bearer credential. Stronger next step: require the guest's
mobile number alongside the reference, or send a one-time code before showing details.

### SEC-05 · Medium — No rate limiting on the public booking endpoint

*Finding:* the anon INSERT policy is open by design; a script with the publishable key could spam
the table (junk data, fake capacity, DB growth).
*Status:* **Fixed** — trigger `enforce_reservation_insert_limits()` (migration `0003`) rejects a
4th active booking for the same mobile + date and more than 10 requests per mobile per day; the UI
maps both to friendly messages. Login endpoints are throttled too (SEC-07), and Cloudflare WAF/rate
limiting can add per-IP control (manual).

### SEC-06 · Medium — No duplicate-submission protection

*Finding:* a double click, an impatient retry, or a flaky connection could create two identical
bookings.
*Status:* **Fixed** — the form generates one `client_request_id` per form session
(`crypto.randomUUID`), sends it with every retry, and a partial unique index
(`reservations_client_request_id_key`) turns the duplicate insert into a no-op the client treats as
success.

### SEC-07 · Medium — No login rate limiting or lockout

*Finding:* the staff login had no client-side throttling, so a script could hammer it (Supabase's own
token-endpoint rate limits were the only obstacle).
*Status:* **Fixed (client) + documented (server)** — `LoginPage` applies exponential backoff
(2 s → 15 s) and a 60-second lock after 5 failures. Server-side limits live in
Supabase → Authentication → Rate Limits (manual, see §3).

### SEC-08 · Medium — No Privacy Policy, Terms, consent notice, or data deletion path

*Finding:* guest PII (name, mobile, email) was collected with no published policy, no consent
notice, and no way for a guest to withdraw or erase their data — a gap against the PH Data Privacy
Act (RA 10173) and GDPR-style expectations.
*Status:* **Fixed** — new `/privacy` and `/terms` pages linked from the footer and routed in the
SPA, a one-time storage notice (`CookieNotice`; no tracking cookies are used), and a guest
self-service cancellation RPC (`cancel_reservation_by_reference`, migration `0003`) surfaced as a
"Need to cancel this booking?" flow on the status page. The privacy policy documents the erasure
process (call us; staff delete or anonymise the row).

### SEC-09 · Low — Validation was client-side only

*Finding:* the Zod schema guarded the UI, but nothing stopped a crafted insert with the public anon
key (e.g. a 10 MB `special_request` or a bogus mobile number).
*Status:* **Fixed** — CHECK constraints on name/mobile/email length + format, `special_request`
≤ 500 chars, branch/package id lengths, reference format, and announcement title/message/button
length limits (migration `0003`).

### SEC-10 · Low — No audit trail for staff actions

*Finding:* status changes and internal notes had `updated_at` only, with no record of *who* changed
*what*.
*Status:* **Fixed** — `audit_log` table + `log_reservation_change()` trigger records actor UUID,
role, action, reference, old/new status and whether notes changed. Readable by staff, writable only
by the trigger; it never stores credentials or full payloads.

### SEC-11 · Info — Session token lives in `localStorage`

*Finding:* `supabase-js` persists the JWT in `localStorage` (its default for SPAs), readable by any
script running on the origin.
*Status:* **Accepted, mitigated** — strict `script-src 'self'` CSP, no XSS sinks in the code, and
short-lived auto-refreshed tokens. Cookie-based sessions would need a server component (Cloudflare
Worker) plus CSRF protection; not worth it for a reservation-only site.

### SEC-12 · Info — Dependency audit clean

`npm audit` → **0 vulnerabilities**. Re-run it after any dependency bump.

---

## 3. Manual checklist (outside the codebase)

The code cannot do these — they live in dashboards:

**If you deploy on Vercel:**

- [ ] Project → Settings → Environment Variables: both `VITE_*` values set for **Production** *and* **Preview**
- [ ] Project → Settings → Domains: custom domain added (Vercel issues and renews TLS automatically, so HTTPS is forced)
- [ ] Project → Firewall: review DDoS/bot protection — custom WAF rules and bot management are plan features (Pro+)
- [ ] Settings → Deployment Protection: preview URLs protected (optional, recommended)
- [ ] `curl -I https://your-domain` shows the five headers (they come from `vercel.json`; `public/_headers` is inert on Vercel)
- [ ] Plan check: Hobby is **non-commercial only** — use Pro for a business site

**If you deploy on Cloudflare:**

- [ ] Cloudflare → SSL/TLS → **Always Use HTTPS** ON
- [ ] Cloudflare → SSL/TLS → Edge Certificates → **HSTS** ON (≥ 6 months, includeSubDomains, preload)
- [ ] Cloudflare → Security → WAF → **Cloudflare Managed Ruleset** ON (free) + **Bot Fight Mode** ON
- [ ] Cloudflare → Security → WAF → **Rate limiting rule** on `/rest/v1/reservations` (plan permitting)
- [ ] Cloudflare → Notifications → alerts for attacks / traffic spikes
- [ ] Supabase → Authentication → Providers → Email → **"Allow new users to sign up" OFF** ← important:
      the publishable key is public, so otherwise anyone can self-register an account through the
      signup API (they still cannot read data — RLS + no `staff_profiles` row — but it is an
      unnecessary surface); create owner/staff users yourself instead
- [ ] Supabase → Authentication → Passwords → minimum length 12+, leaked-password protection if available
- [ ] Supabase → Authentication → Rate Limits → reviewed/tightened
- [ ] Supabase → **MFA (TOTP)** enabled for owner accounts once an enrolment UI ships
- [ ] Supabase → Project Settings → API Keys → rotate the publishable key if it was ever exposed
- [ ] Supabase → Database → every table shows the RLS badge (`staff_profiles`, `reservations`,
      `announcements`, `audit_log`)
- [ ] Supabase → Database → export `reservations` to CSV periodically (free tier has no PITR backups)
- [ ] Supabase → **Advisors → Security → Rerun linter**: no Critical/High findings left (SEC-00 gone)
- [ ] `curl -I https://your-site` shows the five security headers
- [ ] Browser console clean of CSP violations after deploy (home, menu modal, booking, dashboard)
- [ ] `npm audit` clean before each deploy

---

## 4. Residual risks and next steps

1. **Staff MFA** — Supabase supports TOTP, but enrolment/unenrolment needs UI in the dashboard
   (roadmap). Until then use long, unique passwords for owner/staff accounts.
2. **Reference = bearer token** — consider requiring the booking mobile number (or an OTP) to view a
   reservation, and expiring lookups after the visit date.
3. **No alerting on repeated login failures** — free-tier options are Supabase log queries and
   Cloudflare notifications; there is no server code to emit custom alerts.
4. **Free-tier WAF scope** — the OWASP Core Ruleset and advanced rate limiting are paid plans; the
   app-level throttles in migration `0003` are the free backstop.
5. **Bot protection on bookings** — if spam appears, add Cloudflare Turnstile (needs a Worker or
   Supabase's built-in captcha setting) before writing anything custom.
6. **Dependency hygiene** — `@supabase/supabase-js` and Vite should be upgraded deliberately, with
   `npm audit` + a booking/login smoke test after each bump.

---

*Verified on completion: `npx tsc --noEmit` → exit 0, `npx vite build` → exit 0 (dist includes
`_headers`), `npm audit` → 0 vulnerabilities, `git grep` for live credentials → no tracked matches,
built `index.html` contains one external module script plus the CSP-exempt JSON-LD data block.
(`slot_usage` is now the `slot_usage_for_branch_date` RPC — migration `0004` resolves the
Supabase Advisor's *Security Definer View* finding; re-run the linter after applying it.)*



