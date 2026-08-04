# Deploy ParkSwift Lite to Vercel

This project is now Vercel-ready as a static POC deployment.

## What will deploy

Default route:

```text
/ -> poc.html
```

Extra routes:

```text
/poc -> poc.html
/app -> index.html
/pitch -> investor-pitch.html
/phases -> phases.html
/backend-demo -> backend-connected.html
```

## Backend note

The project now includes two backend options:

1. `backend/server.js` — local/VPS JSON-file demo backend.
2. `api/*` — Vercel serverless API routes backed by Supabase.

For Vercel production, use the `api/*` routes with Supabase environment variables. See `VERCEL_SUPABASE_SETUP.md`.

## Option 1: Deploy with Vercel CLI

From this folder:

```bash
cd smart-parking-finder
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
5. Set framework preset to **Other**.
6. Leave build command empty or use:

```bash
npm run vercel-build
```

7. Set output directory to the project root or leave blank.
8. Deploy.

## Google AdSense note

Before public production deployment, replace these placeholders in `poc.html`:

```text
ca-pub-REPLACE_WITH_YOUR_PUBLISHER_ID
REPLACE_WITH_FEED_SLOT_ID
REPLACE_WITH_SIDEBAR_SLOT_ID
```

Google ads will only show after your AdSense account/domain is approved.

## Vercel backend environment variables

Set these in Vercel Project Settings:

```text
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
ADMIN_TOKEN=change-this-admin-token
```

Run `supabase/schema.sql` and `supabase/seed.sql` in Supabase first.

## Local JSON backend option

For local demos without Supabase:

```bash
cd smart-parking-finder/backend
PORT=8787 ADMIN_TOKEN=change-this-token node server.js
```
