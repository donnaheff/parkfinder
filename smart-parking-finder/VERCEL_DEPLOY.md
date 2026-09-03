# Deploy ParkSwift to Vercel

This project is a Next.js app (App Router, fully client-rendered — `output: 'export'`) plus a set of
standalone Vercel serverless functions in `api/*` backed by Supabase. Marketing/pitch pages remain
static HTML served from `public/`.

## What will deploy

Core app routes (Next.js, client-rendered):

```text
/          Home — live search
/map       Live parking map
/lots      Full lot list with filters
/areas     Neighborhood rollup
/updates   Community status reports
/owner     Owner registration + lot management
/operator  Operator occupancy console
/admin     Admin verification queue
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
Optionally add `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` to enable rate limiting on
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
