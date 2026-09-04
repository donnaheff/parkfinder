# Deploy ParkSwift to Vercel

This project is a Next.js app (App Router) plus a set of standalone Vercel serverless functions in
`api/*` backed by Supabase. Marketing/pitch pages remain static HTML served from `public/`.

Since Phase 10, five public pages are server-rendered for SEO: `/`, `/lots`, `/areas`, `/updates`,
and `/lot/[id]` (the lot detail page — now a real dynamic route instead of a `?id=` query string).
Everything else (`/owner`, `/admin`, `/reservations`, `/login`, `/map`, `/operator`) stays a pure
client component, unchanged — they're auth-gated or need live browser APIs (geolocation, Mapbox),
so server rendering doesn't help them. This was a deliberate, scoped exception for those 5 routes,
not a reversal of the client-rendered architecture: `next.config.js` no longer sets
`output: 'export'`, since there's no partial-export mode, but the app is still mostly client
components fetching from the same `api/*` endpoints.

## What will deploy

Core app routes:

```text
/             Home — live search (server-rendered)
/lots         Full lot list with filters (server-rendered)
/areas        Neighborhood rollup (server-rendered)
/updates      Community status reports (server-rendered)
/lot/:id      Lot detail (server-rendered, per-lot metadata for SEO)
/map          Live parking map (client-rendered)
/reservations Reservations + payment (client-rendered)
/owner        Owner registration + lot management (client-rendered)
/operator     Operator occupancy console (client-rendered)
/admin        Admin verification queue (client-rendered)
/login        Sign in / sign up (client-rendered)
```

Marketing/static routes (served from `public/`, unchanged):

```text
/pitch  -> investor-pitch.html
/phases -> phases.html
... plus every other *.html file in public/, at its own filename
```

Legacy URLs redirect to their Next.js equivalents:

```text
/poc          -> /
/app          -> /
/backend-demo -> /admin
/lot?id=:id   -> /lot/:id   (old flat query-string route, pre-Phase-10)
```

## Backend note

The project includes two backend options:

1. `backend/server.js` — local/VPS JSON-file demo backend. Predates Supabase Auth (see its
   README) — useful for the public search/map/lots flows, not the owner/admin flows.
2. `api/*` — Vercel serverless API routes backed by Supabase, with real authentication.

For Vercel production, use the `api/*` routes with Supabase environment variables. See `VERCEL_SUPABASE_SETUP.md`.

## Option 1: Deploy with Vercel CLI

From this folder:

```bash
cd smart-parking-finder
npm install
npx vercel login
npx vercel
```

For production:

```bash
npx vercel --prod
```

## Option 2: Deploy from GitHub

1. Push this folder to a GitHub repository.
2. Go to Vercel Dashboard.
3. Click **Add New Project**.
4. Import the GitHub repository.
5. Framework preset **Next.js** is auto-detected.
6. Build command: `npm run build` (default).
7. Deploy.

## Local development

```bash
cd smart-parking-finder
npm install
npm run dev
```

This starts the Next.js dev server. Point it at a running API (either `backend/server.js` locally, or
the deployed `api/*` routes) by setting `NEXT_PUBLIC_API_BASE` — it defaults to same-origin, which is
what production uses.

## Vercel backend environment variables

Set these in Vercel Project Settings:

```text
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

The `NEXT_PUBLIC_*` pair powers sign-in in the browser and is meant to be public — see
`VERCEL_SUPABASE_SETUP.md` for the full explanation and how to make your account an admin.
Add `NEXT_PUBLIC_MAPBOX_TOKEN` (free tier at mapbox.com) for the real map, destination
autocomplete, and owner-address geocoding — without it those features degrade gracefully rather
than breaking. Optionally add `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` to enable rate limiting on
write endpoints.

Run `supabase/schema.sql` and `supabase/seed.sql` in Supabase first.

## Local JSON backend option

For local demos without Supabase:

```bash
cd smart-parking-finder/backend
PORT=8787 ADMIN_TOKEN=change-this-token node server.js
```

Then, in another terminal:

```bash
cd smart-parking-finder
NEXT_PUBLIC_API_BASE=http://localhost:8787 npm run dev
```

## Testing

```bash
npm run lint    # ESLint
npm test        # Vitest — unit tests for lib/format.js and api/_lib/parking.js
npx playwright test        # e2e — smoke + axe-core accessibility scan, no credentials needed
```

`npx playwright test` also picks up `e2e/auth-flows.spec.js`, which covers owner
register → submit → admin approve and reserve → cancel against a *real* Supabase
test project (the local JSON backend predates the Auth/JWT rewrite and can't serve
those routes). It self-skips unless `E2E_BASE_URL`, `E2E_OWNER_EMAIL`,
`E2E_OWNER_PASSWORD`, `E2E_ADMIN_EMAIL`, and `E2E_ADMIN_PASSWORD` are all set — see
the top of that file for what each needs. CI (`.github/workflows/ci.yml`) runs lint,
unit tests, build, and the e2e suite (smoke always, auth-flows only if those five are
configured as repo secrets) on every PR and push to `main`.
