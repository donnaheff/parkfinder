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

## 2. Add Vercel environment variables

In Vercel project settings, add:

```text
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
ADMIN_TOKEN=change-this-admin-token
```

Important: use the **service role key only in Vercel server environment variables**. Never put it in browser JavaScript.

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

## 5. Admin moderation token

Admin endpoints require:

```text
x-admin-token: YOUR_ADMIN_TOKEN
```

The `/admin` page prompts for this token at runtime and stores it in `localStorage` on the admin's own
browser — it is never hardcoded in the client bundle. For production, still replace the single shared
token with proper admin authentication (see hardening list below).

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

Before a public launch, add:

- Real user authentication
- Owner sessions
- Admin login instead of static token
- Rate limiting
- CAPTCHA or abuse protection
- Supabase Storage for images
- Row-level security policies
- Audit logging UI
- Error monitoring
- Custom domain setup
