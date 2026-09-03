# ParkSwift Vercel + Supabase Backend Setup

The project now includes Vercel serverless API routes in `api/`.

## Architecture

```text
Next.js app (client-rendered, output: 'export')
  ├─ / /map /lots /areas /updates /owner /operator /admin
  └─ public/*.html — marketing/pitch pages, unchanged

Vercel serverless API
  └─ /api/*

Supabase
  ├─ PostgreSQL tables
  └─ optional Storage later
```

## 1. Create Supabase project

1. Go to Supabase.
2. Create a new project.
3. Open SQL Editor.
4. Run:

```text
supabase/schema.sql
```

5. Then run:

```text
supabase/seed.sql
```

This creates the tables and inserts the first six car parks.

`parking_lots` also has `city`/`country` columns (default `'Lagos'`/`'Nigeria'`, matching the seed
data) now that lot coordinates come from real Mapbox geocoding instead of the old Lagos-only
`areaCoords()` area-name heuristic — owners entering a lot outside Lagos should fill those in on the
form so search and geocoding target the right city. If your project predates this, re-run
`schema.sql` (idempotent) to pick up the new columns.

## 2. Add Vercel environment variables

In Vercel project settings, add:

```text
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` are what the browser uses for sign-in —
they're meant to be public (RLS is what actually protects data, see `supabase/schema.sql`). Note
`NEXT_PUBLIC_*` vars are baked in at **build time** since this is a static export: redeploy after
changing them.

Important: use the **service role key only in the non-public server env vars above**. Never put it
in a `NEXT_PUBLIC_*` variable or browser JavaScript.

For the real interactive map, geocoding search, and address lookup (replacing the old illustrative
SVG map), add a free [Mapbox](https://mapbox.com) token:

```text
NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_MAPBOX_PUBLIC_TOKEN
```

Without it, `/map` shows a "set a Mapbox token" placeholder instead of crashing, and destination
search/owner-address geocoding just skip the autocomplete/auto-fill step.

Optionally, add rate limiting on write endpoints (owner registration, lot submission, community
reports, saved parks) by creating a free [Upstash](https://upstash.com) Redis database and setting:

```text
UPSTASH_REDIS_REST_URL=https://YOUR-DB.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_UPSTASH_REST_TOKEN
```

Without these, the API still works — rate limiting just no-ops.

Reservations use a cron job (`vercel.json`'s `crons`) to release expired holds. Set:

```text
CRON_SECRET=a-long-random-secret
```

Vercel sends this automatically as a Bearer token on scheduled invocations of `/api/cron/release-holds`
once it's set — generate one with e.g. `openssl rand -hex 32`. Without it, the endpoint fails closed
(500) rather than running unauthenticated. Note Vercel's Hobby plan limits cron jobs to once per day;
the configured 15-minute schedule needs a Pro plan. Until a sweep runs, an expired-but-unreleased
hold keeps its space marked unavailable (available_spaces was decremented atomically when the hold
was created, and only the sweep — or the user manually confirming or cancelling — puts it back), so
infrequent sweeping is a real availability-accuracy problem on Hobby, not just a cosmetic one.

For email notifications (reservation hold confirmations, admin approve/reject/request-info updates
to owners) add a free [Resend](https://resend.com) account and verify a sending domain, then set:

```text
RESEND_API_KEY=YOUR_RESEND_API_KEY
EMAIL_FROM=ParkSwift <notifications@yourdomain.com>
```

Without `RESEND_API_KEY`, the API still works — emails just don't send (logged, not thrown).

Reviews and real photo uploads need no extra env vars — `supabase/schema.sql` already creates the
`reviews` table (one review per user per lot, enforced by a unique constraint; `parking_lots.rating`
is kept in sync by a trigger that recomputes the average on every insert/update/delete) and the
public `lot-photos` Storage bucket with its access policies. Just make sure you ran the current
`schema.sql` — if your project was set up before Phase 5, re-run it in the SQL Editor (it's
idempotent) to pick up the `reviews` table and the storage bucket/policies.

## 3. Deploy to Vercel

```bash
cd smart-parking-finder
npx vercel login
npx vercel --prod
```

## 4. Test endpoints

After deployment, test:

```text
https://YOUR-APP.vercel.app/api/health
https://YOUR-APP.vercel.app/api/parks
https://YOUR-APP.vercel.app/admin
```

## 5. Make yourself an admin

Admin access is a real Supabase Auth session plus membership in the `admins` table — there's no
shared token or self-serve "become an admin" flow, deliberately:

1. Sign up for an account through the app's own `/login` page (Sign up tab).
2. Confirm the email if your Supabase project requires it.
3. In the Supabase SQL Editor, find your user id and add it as an admin:

```sql
select id, email from auth.users where email = 'you@example.com';
insert into public.admins (user_id) values ('<the uuid from above>');
```

4. Sign in on `/login` and visit `/admin` — the verification queue should load.

## Serverless API routes included

### Public

```text
GET    /api/health
GET    /api/parks
GET    /api/parks/:id
GET    /api/areas
GET    /api/updates
POST   /api/updates
GET    /api/saved
POST   /api/saved
DELETE /api/saved/:id
GET    /api/reviews
POST   /api/reviews
DELETE /api/reviews/:id
```

### Owner

```text
POST  /api/owner/register
GET   /api/owner/parks
POST  /api/owner/parks
PATCH /api/owner/parks/:id/availability
PATCH /api/owner/parks/:id/open-status
```

### Admin

```text
GET   /api/admin/submissions
PATCH /api/admin/parks/:id/approve
PATCH /api/admin/parks/:id/reject
PATCH /api/admin/parks/:id/request-info
PATCH /api/admin/parks/:id
```

### Utility

```text
POST /api/uploads/photo
POST /api/seed
```

## Production hardening still needed

Done: real user authentication (Supabase Auth), owner sessions, admin access via a real signed-in
account instead of a shared token, row-level security policies, optional rate limiting, reservations
with atomic holds, email notifications, reviews/ratings, and Supabase Storage for lot photos.

Still worth adding before a public launch:

- CAPTCHA or abuse protection beyond rate limiting
- Payments for reservations (currently a stub — a hold is created and released/confirmed manually,
  no charge is taken; see `lib/payments.js`)
- Audit logging UI (the `admin_actions` table is populated, but nothing displays it yet)
- Error monitoring (Sentry or similar)
- Custom domain setup
- Password reset flow (Supabase Auth supports it; not yet wired into `/login`)
