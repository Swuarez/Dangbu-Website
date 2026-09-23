# DANGBU Unlimited Samgyupsal & Buffet

Production restaurant website with a full reservation system, announcement bar, and a
staff dashboard — built to run entirely on **free tiers** (Supabase Free + Cloudflare
Pages Free or Vercel Hobby).

![Stack](https://img.shields.io/badge/React_19-Vite_6-61dafb) ![TS](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS_4-shadcn/ui-38bdf8)

## Features

**Public website**
- Hero with merged occasions ribbon, plus menu, experience, reservation, branches and contact sections
- **Full-screen menu viewer** — every poster (`img1–4.jpg`) opens complete and uncropped
  (`object-contain`, viewport-safe sizing, zoom toggle, Esc/backdrop close, "Open full size")
- Dedicated shareable menu routes: `/menu/299` `/menu/399` `/menu/459` `/menu/499`
- Reservation form: branch → date → live slot availability → guest details → confirmation
  ticket with a `DANGBU-YYYY-XXXXX` reference + `/reservation/:reference` status page
- Announcement strip at the very top of the site (Supabase Realtime, dismissible)

**Staff dashboard** (`/login` → `/dashboard`)
- Dashboard home with today's live numbers
- Reservations: search, status/branch/date filters, pagination, confirm / complete /
  no-show / cancel, internal notes — realtime refresh
- Announcements: create, edit, activate/deactivate, delete, optional button link
- Staff management (owner only) and a settings overview
- Responsive: sidebar on desktop, drawer on mobile

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS 4, shadcn/ui (Radix), Motion |
| Forms | React Hook Form + Zod, date-fns |
| Icons | lucide-react |
| Backend | Supabase Free — Auth, PostgreSQL, Realtime, Row Level Security |
| Hosting | Cloudflare Pages Free (recommended) or Vercel Hobby — static SPA |

No paid services, APIs, SDKs or hosting plans are required. Branch directions use plain
Google Maps search URLs (no paid Maps API).

## Project structure

```text
├─ supabase/migrations/      SQL: schema + RLS + owner bootstrap
├─ public/                   favicon, og-image, _redirects (SPA fallback)
├─ src/
│  ├─ assets/                img1–4.jpg menu posters (bundled, no CDN)
│  ├─ components/            sections, MenuModal, AnnouncementBar, ui/ primitives
│  ├─ context/               AuthContext, ReservationIntentContext
│  ├─ data/                  menu, branches, reservation rules, site info
│  ├─ layouts/               DashboardLayout
│  ├─ lib/                   utils (cn), supabaseClient
│  ├─ pages/                 Home, MenuViewer, Login, dashboard/*, status, 404
│  ├─ schemas/               Zod reservation schema
│  ├─ services/              reservationService (store seam), supabaseReservationStore,
│  │                          staffService, announcementService
│  └─ types/                 database row types + mappers
├─ .env.example              environment template (copy to .env)
├─ vercel.json               SPA rewrites for Vercel
└─ DEPLOYMENT.md             step-by-step free deployment guide
```

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
```

Without env vars the site runs fully offline: reservations use a localStorage adapter and
`/login` shows a setup notice. With env vars, everything talks to Supabase.

## Environment setup

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Both are **public** client credentials (Supabase → Project Settings → API Keys). RLS protects
all data. The `service_role` / secret key must **never** be used in this app.

## Supabase setup

1. Create a free Supabase project.
2. SQL Editor → run `supabase/migrations/0001_initial_schema.sql` (tables, RLS policies,
   `slot_usage` view, `reservation_by_reference` function).
3. Authentication → Users → Add user (owner) → copy the UUID.
4. SQL Editor → run `0002_first_owner.sql` with that UUID pasted in.
5. SQL Editor → run `0003_security_hardening.sql` (idempotency key, server-side input
   checks, per-guest booking throttle, guest cancellation RPC, staff audit log).
6. Sign in at `/login`. Additional staff: create their auth user, then manage roles on
   the dashboard **Staff** page.

## Security

Full audit, fixes and the manual dashboard checklist live in **[SECURITY.md](SECURITY.md)**.
Already in place: security headers (`public/_headers` + `vercel.json`), RLS on every table,
PII-free public views, server-side input validation, booking idempotency + throttling,
audit logging, and Privacy Policy / Terms pages.

Full walkthrough: **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Scripts

```bash
npm run dev         # dev server
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + production build → dist/
npm run preview     # serve the production build locally
```

## Free deployment (summary)

1. Push to GitHub.
2. **Cloudflare Pages**: connect repo → Vite preset → build `npm run build`, output `dist`
   → add the two env vars → deploy (SPA fallback via `public/_redirects`).
   *or* **Vercel Hobby**: import repo → env vars → deploy (SPA fallback via `vercel.json`).
3. Add the deployed URL in Supabase → Authentication → URL Configuration.
4. Run the acceptance checklist in DEPLOYMENT.md.

> Free tiers are current vendor offerings with real limits and no permanence guarantee —
> see DEPLOYMENT.md for the honest breakdown before relying on them.

## Troubleshooting

- **White screen / wrong data after adding env vars** — restart `npm run dev`; Vite reads
  env vars only at startup.
- **"Dashboard not configured"** — env vars missing or containing the placeholder URL.
- **Login works but dashboard says "No staff access"** — the user's UUID has no row in
  `staff_profiles` (run migration 0002 or use the Staff page as owner).
- **RLS errors in dashboard** — migration 0001 was not run (or ran in another project).
- **Deep links 404 on the host** — SPA fallback not applied; confirm `_redirects` /
  `vercel.json` are part of the deployment.
- More: [DEPLOYMENT.md → Troubleshooting](DEPLOYMENT.md#troubleshooting).
