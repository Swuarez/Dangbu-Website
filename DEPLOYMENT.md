# Deployment & Setup Guide

**Dangbu Unlimited Samgyupsal & Buffet** — public website + reservation system + staff dashboard, deployable entirely on free tiers. Written against the current (2026) vendor consoles.

## Architecture

```text
React 19 + Vite 6 (static SPA, no server code)
       │
       ▼
Cloudflare Workers Static Assets (Free)  — recommended
   or  Cloudflare Pages (Free) / Vercel (Hobby)
       │
       ▼
Supabase (Free plan)
 ┌─────────────────┐
 │ Authentication  │  staff login (email + password)
 │ PostgreSQL      │  reservations, announcements, staff roles
 │ Realtime        │  live updates for dashboard + announcement bar
 │ RLS             │  all authorization enforced in the database
 └─────────────────┘
```

One deployment serves everything:

```text
https://your-site.workers.dev/             public website
https://your-site.workers.dev/menu/299     full menu viewer (also /399 /459 /499)
https://your-site.workers.dev/login        staff login
https://your-site.workers.dev/dashboard    staff dashboard
```

No paid backend server, no paid APIs, no credit card required for the services below.

> **Honesty note on "free":** free tiers are current vendor offerings, not permanent guarantees — verify on each vendor's pricing page before launch. Approximate limits at the time of writing:
>
> | Service | Free-tier limits (approximate, subject to change) |
> |---|---|
> | Supabase Free | 500 MB database, 1 GB file storage, ~5 GB egress/month, ~200 concurrent Realtime connections, projects **pause after ~1 week of inactivity** (unpause in seconds from the dashboard, no data loss) |
> | Cloudflare Workers Free | 100,000 requests/day; static asset requests are unmetered |
> | Cloudflare Pages Free | static hosting, 500 builds/month, unlimited static requests |
> | Vercel Hobby | **non-commercial use only**, 100 GB bandwidth/month |
>
> **If this site is used commercially, Vercel Hobby's terms do not permit it — use Cloudflare.** A small restaurant's normal traffic fits comfortably within Supabase Free + Cloudflare's free tier.

---

## Step 1 — Create the Supabase (Free) project

1. Sign up at <https://supabase.com> (free, no card).
2. **New project** → name (e.g. `dangbu`), strong database password (save it), region closest to your guests (e.g. Singapore).
3. Wait for provisioning.

## Step 2 — Run the SQL migrations

1. Supabase dashboard: **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql) and **Run**.
   - Creates `staff_profiles`, `reservations`, `announcements`
   - Enables Row Level Security on all tables
   - Creates the `slot_usage` view (anonymous-safe seat counts, no personal data)
   - Creates the `reservation_by_reference` lookup function for guests
3. Paste the entire contents of [`supabase/migrations/0003_security_hardening.sql`](supabase/migrations/0003_security_hardening.sql) and **Run**.
   - Adds the `client_request_id` idempotency key (duplicate-submit guard)
   - Adds server-side CHECK constraints mirroring the client validation rules
   - Adds a per-mobile booking throttle trigger (3 active bookings/day, 10 requests/day)
   - Adds `cancel_reservation_by_reference()` so guests can cancel their own booking
   - Adds the `audit_log` table + trigger recording staff reservation changes
4. Confirm: **Table Editor** lists four tables (`staff_profiles`, `reservations`, `announcements`, `audit_log`).

## Step 3 — Create the owner (and staff) login accounts

1. **Authentication → Users → Add user → Create new user**: owner email + strong password, enable **Auto Confirm User**.
2. Copy the new user's **UUID** from the users list.
3. **SQL Editor → New query**: open [`supabase/migrations/0002_first_owner.sql`](supabase/migrations/0002_first_owner.sql), replace `PASTE-OWNER-USER-UUID-HERE` with the UUID, **Run**.
4. More staff later: create their auth user the same way; the owner manages roles on the dashboard **Staff** page (or insert a `staff_profiles` row with role `staff` via SQL).

> Creating auth users is intentionally done in the Supabase Dashboard — it needs server-side privileges that must never ship in the frontend.

## Step 4 — Get your API keys (updated for 2026)

Supabase introduced new API keys and is **deprecating the legacy `anon` / `service_role` JWT keys by the end of 2026** ([docs](https://supabase.com/docs/guides/api/api-keys)). This project works with either format (`@supabase/supabase-js` ≥ 2.49 supports the new keys; we use 2.117), but use the new one:

1. Supabase dashboard → **Project Settings → API Keys** (or the project **Connect** dialog):
   - **Project URL** → `VITE_SUPABASE_URL` (looks like `https://<project-ref>.supabase.co`)
   - **Publishable key** (`sb_publishable_...`) → `VITE_SUPABASE_ANON_KEY`
2. **Never** use a `sb_secret_...` (or legacy `service_role`) key here — it bypasses RLS and must never appear in frontend code, URLs, or logs.
3. The publishable key is safe to ship in the browser precisely because every table is protected by RLS — think of it as a key that "only opens the lobby."

> The env var is still *named* `VITE_SUPABASE_ANON_KEY` even when it holds a publishable key — the name is just a label.

## Step 5 — Local setup & verification

```bash
npm install
cp .env.example .env   # fill in the two values from step 4
npm run dev            # http://localhost:5173
npm run typecheck      # tsc --noEmit — must pass clean
npm run build          # production build to dist/
npm run preview        # smoke-test the build on :4173
```

No Supabase project yet? Leave both values empty — the site runs fully offline (reservations use a localStorage adapter; staff pages show a setup notice).

## Step 6 — Push the project to GitHub

```bash
git add .
git commit -m "feat: Dangbu site with menu viewer, reservations, staff dashboard"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`.env` is git-ignored; only `.env.example` (placeholders, no secrets) is committed.

## Step 7 — Deploy the frontend (choose one, all free)

### Option A — Cloudflare Workers Static Assets (recommended; current Cloudflare standard)

Cloudflare's current recommendation for static sites is **Workers with Static Assets** (Pages remains supported, but new features land on Workers). This repo ships a ready [`wrangler.jsonc`](wrangler.jsonc) that points at `dist/` and enables SPA fallback (`not_found_handling = "single-page-application"`).

> ⚠️ **Do not add `public/_redirects` when deploying to Workers.** A rule like `/*  /index.html  200` is rejected by the Workers upload with *"Infinite loop detected in this rule"* (**error 100324**) — that file is a Cloudflare **Pages** feature. It has been removed from this repo on purpose; the SPA fallback comes from `not_found_handling` instead (see Option B if you ever switch to Pages).

**From the dashboard (git-connected, auto-deploys on push):**

1. <https://dash.cloudflare.com> → **Workers & Pages → Create → Import a repository** → select the repo.
2. Build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy` (usually pre-filled)
3. **Variables and Secrets** (build-time, since Vite inlines env at build): add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Direct links like `/menu/299` work via the SPA fallback in `wrangler.jsonc`.

**Or from your machine (one-off):**

```bash
npm run build
npx wrangler deploy        # first run asks you to log in to Cloudflare
```

### Option B — Cloudflare Pages (classic; still fully supported)

1. <https://pages.cloudflare.com> → **Create → Pages → Connect to Git** → select the repo.
2. Build settings: framework preset **Vite**, build command `npm run build`, output directory `dist`.
3. **Environment variables** (Production + Preview): add both `VITE_*` variables.
4. **Create `public/_redirects`** — it is intentionally absent from this repo because Workers rejects it (error 100324), but **Pages needs it** for deep links. Add a file with exactly this line:

   ```text
   /*    /index.html   200
   ```

5. Deploy. SPA routing then works for `/menu/299`, `/privacy` and `/reservation/…` on hard refresh.

### Option C — Vercel Hobby (non-commercial use only per Vercel's terms)

1. <https://vercel.com/new> → import the repo.
2. Framework preset: **Vite** (build `npm run build`, output `dist` — auto-detected).
3. Add the two environment variables.
4. Deploy. SPA routing works via the included `vercel.json` rewrites.

## Step 8 — Supabase auth redirect URLs

1. Supabase dashboard → **Authentication → URL Configuration**.
2. Set **Site URL** to your deployed URL (e.g. `https://your-site.workers.dev`).
3. Add `https://your-site.workers.dev/**` to **Redirect URLs**.
   - This app signs in with email + password, so redirects only matter for future magic-link/recovery flows — setting them now avoids surprises.

## Step 9 — Test everything

Public website:

- [ ] Home loads; navbar + mobile navbar work; scroll-spy follows Hero → Menu → Experience order
- [ ] Hero: occasion tiles (Family / Friends / Dates / Celebrations) each open the reservation form
- [ ] Each menu card opens the menu modal; `/menu/299`, `/menu/399`, `/menu/459`, `/menu/499` show the complete posters directly (also on hard refresh — proves the SPA fallback works)
- [ ] Reservation form: branch/date/time, live slot availability, confirmation ticket with a `DANGBU-YYYY-XXXXXXXX` (8-char) reference
- [ ] Booking status page `/reservation/<reference>` finds the booking
- [ ] Status page shows **Need to cancel this booking?** for upcoming bookings and cancels on confirm
- [ ] `/privacy` and `/terms` load from the footer links; the storage notice appears once and stays dismissed

Dashboard:

- [ ] `/login` signs the owner in; wrong passwords fail cleanly
- [ ] A new test reservation appears under **Reservations** in realtime (no refresh)
- [ ] Search, status/branch/date filters, pagination all work
- [ ] Confirm / Complete / No-show / Cancel update the booking
- [ ] Internal notes save and are never shown publicly
- [ ] **Announcements**: create one (active) → it appears at the top of the public site without reload; deactivate → it disappears
- [ ] **Staff** page lists accounts; role changes apply (owner only)
- [ ] Non-staff accounts are blocked from `/dashboard`
- [ ] Mobile: sidebar collapses into a working drawer

Security spot-checks:

- [ ] `curl -I https://your-site` returns `strict-transport-security`, `content-security-policy`,
      `x-content-type-options`, `x-frame-options` and `referrer-policy`
- [ ] Browser console shows no CSP violations on the home page, menu modal, booking flow or dashboard
- [ ] Submitting the same booking form twice in a row (double click / retry) creates ONE reservation
- [ ] A 4th active booking for the same mobile number + date is rejected with the "already have
      several active bookings" message
- [ ] Changing a reservation status in the dashboard writes a row into `audit_log`

---

## Step 10 — Security setup that lives outside the codebase

The app ships hardened (see [SECURITY.md](SECURITY.md)), but these controls are
dashboard-side and must be switched on by hand.

**Edge / CDN (Cloudflare — or your host's equivalents):**

1. **SSL/TLS → Edge Certificates**: enable **Always Use HTTPS** and **HSTS**
   (max-age ≥ 6 months, include subdomains, preload once you are sure about every subdomain).
2. **Security → WAF**: enable the **Cloudflare Managed Ruleset** (free plan) and **Bot Fight Mode**.
3. **Security → WAF → Rate limiting rules**: add a rule like
   *path `/rest/v1/reservations` → 10 requests / minute / IP → block* if your plan supports it.
4. Verify the headers actually arrive:
   `curl -I https://your-site` should show `strict-transport-security`, `content-security-policy`,
   `x-content-type-options`, `x-frame-options`, `referrer-policy` (these come from
   `public/_headers` on Cloudflare, or `vercel.json` on Vercel).

**Supabase dashboard:**

1. **Authentication → Providers → Email**: turn **off** "Allow new users to sign up".
   The publishable key is public, so without this anyone can create an account through the
   signup API; owner/staff accounts should only be created by you in **Authentication → Users**.
2. **Authentication → Passwords**: raise minimum length (12+) and enable leaked-password
   protection if your plan includes it.
3. **Authentication → Settings → Rate Limits**: keep (or tighten) the token-endpoint limits —
   they are the real backstop against brute-force login attempts.
4. **Authentication → Multi-Factor Auth**: TOTP is available; enforcing it for owner accounts
   needs an enrollment UI in the app (on the roadmap — see SECURITY.md).
5. **Project Settings → API Keys**: rotate the publishable key if it was ever committed to git,
   then update `.env` locally and the env vars in your host's dashboard, and redeploy.
6. **Database → Backups / exports**: the free tier has no point-in-time recovery — export
   `reservations` (CSV) periodically if the data matters to you.

---

## Supabase free-tier efficiency (already built in)

- **No polling** — dashboard and announcement bar use one Realtime channel each, open only while mounted, always removed on unmount.
- **Pagination** — reservation lists load 15 rows at a time, not the whole table.
- **Minimal columns** — queries select only the fields the UI renders; dashboard stats use head-only `COUNT` queries.
- **PII-free public reads** — guests never read the `reservations` table; availability comes from the aggregate `slot_usage` view, status checks go through `reservation_by_reference`.
- **Local assets** — menu posters are bundled static files, not metered storage/CDN.
- **Realtime limits** — `eventsPerSecond` capped at 5 in the client config. Note: anonymous (publishable-key) Realtime connections are limited to 24 hours by Supabase; page reloads reconnect automatically.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| "Dashboard not configured" | Missing `VITE_*` env vars on the host → add them (build-time!) and redeploy |
| Changed env vars but nothing changed | Vite inlines env at build time — trigger a fresh build/deploy, not just a restart |
| "Your session is not authorized" | No `staff_profiles` row for the user → run step 3 |
| Slots load but booking insert fails | Migrations not run → run step 2 |
| Announcement doesn't appear publicly | Check `is_active`, `starts_at`, `ends_at` window |
| Dashboard empty for staff | RLS: confirm the migrations ran in the right project |
| Deploy fails: `Invalid _redirects configuration … Infinite loop detected in this rule` (code 100324) | `public/_redirects` exists while deploying to Workers → delete it (the SPA fallback is `not_found_handling` in `wrangler.jsonc`); keep `_redirects` only for Pages hosting |
| Auth errors mentioning `apikey` header | Old key on new client or vice versa → prefer the `sb_publishable_` key from Settings → API Keys |
| Project unreachable after idle days | Supabase Free paused it → open dashboard, unpause |
| 404 on refresh at `/menu/299` etc. | SPA fallback missing → Workers: check `wrangler.jsonc` deployed; Pages: `_redirects`; Vercel: `vercel.json` |
| `wrangler deploy` asks for a Worker name/script | `wrangler.jsonc` not found → run from the repo root |
